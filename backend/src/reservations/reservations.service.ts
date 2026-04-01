import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from './reservation.entity';
import { Salle } from '../salles/salle.entity';
import { CreerReservationDto } from './dto/creer-reservation.dto';
import { ModifierReservationDto } from './dto/modifier-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private repo: Repository<Reservation>,
    @InjectRepository(Salle)
    private salleRepo: Repository<Salle>,
  ) {}

  /**
   * Détecte les conflits sur une plage de dates.
   * Deux réservations sont en conflit si :
   * - Elles concernent la même salle
   * - Leurs plages de dates se chevauchent (dateDebut1 <= dateFin2 ET dateFin1 >= dateDebut2)
   * - Leurs créneaux horaires se chevauchent (ou l'une est journée entière)
   */
  private async verifierConflit(dto: CreerReservationDto, excludeId?: number): Promise<void> {
    // Récupérer toutes les réservations de la salle dont la plage de dates chevauche
    const candidats = await this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.entreprise', 'entreprise')
      .where('r.salleId = :salleId', { salleId: dto.salleId })
      .andWhere('r.dateDebut <= :dateFin', { dateFin: dto.dateFin })
      .andWhere('r.dateFin >= :dateDebut', { dateDebut: dto.dateDebut })
      .getMany();

    for (const existante of candidats) {
      if (existante.id === excludeId) continue;
      const nom = existante.entreprise?.nom ?? 'une autre entreprise';
      const plage = existante.dateDebut === existante.dateFin
        ? existante.dateDebut
        : `${existante.dateDebut} → ${existante.dateFin}`;

      if (existante.estJourneeEntiere) {
        throw new ConflictException(
          `La salle est déjà réservée en journée entière par ${nom} (${plage})`,
        );
      }
      if (dto.estJourneeEntiere) {
        throw new ConflictException(
          `La salle a déjà des réservations sur cette période (${nom}, ${existante.heureDebut}–${existante.heureFin}, ${plage})`,
        );
      }
      if (dto.heureDebut && dto.heureFin && existante.heureDebut && existante.heureFin) {
        if (dto.heureDebut < existante.heureFin && dto.heureFin > existante.heureDebut) {
          throw new ConflictException(
            `Conflit : la salle est déjà réservée de ${existante.heureDebut} à ${existante.heureFin} par ${nom} (${plage})`,
          );
        }
      }
    }
  }

  private async verifierAppartenance(salleId: number, hotelId?: number): Promise<void> {
    if (!hotelId) return;
    const salle = await this.salleRepo.findOne({ where: { id: salleId }, relations: ['etage'] });
    if (!salle || salle.etage?.hotelId !== hotelId) {
      throw new ForbiddenException("Cette salle n'appartient pas à votre hôtel");
    }
  }

  async creer(dto: CreerReservationDto, creeParId?: number, hotelId?: number): Promise<Reservation> {
    if (dto.dateDebut > dto.dateFin) {
      throw new BadRequestException('La date de début doit être avant ou égale à la date de fin');
    }
    if (!dto.estJourneeEntiere) {
      if (!dto.heureDebut || !dto.heureFin) {
        throw new BadRequestException('heureDebut et heureFin sont requis pour un créneau');
      }
      if (dto.heureDebut >= dto.heureFin) {
        throw new BadRequestException("L'heure de début doit être avant l'heure de fin");
      }
    }

    await this.verifierAppartenance(dto.salleId, hotelId);
    await this.verifierConflit(dto);

    const reservation = this.repo.create({ ...dto, creeParId });
    return this.repo.save(reservation);
  }

  trouverToutes(hotelId?: number, dateDebut?: string, dateFin?: string): Promise<Reservation[]> {
    if (hotelId) {
      const qb = this.repo
        .createQueryBuilder('reservation')
        .leftJoinAndSelect('reservation.salle', 'salle')
        .leftJoinAndSelect('salle.etage', 'etage')
        .leftJoinAndSelect('etage.hotel', 'hotel')
        .leftJoinAndSelect('reservation.entreprise', 'entreprise')
        .where('etage.hotelId = :hotelId', { hotelId });

      // Chevauche la plage de filtre
      if (dateDebut && dateFin) {
        qb.andWhere('reservation.dateDebut <= :dateFin AND reservation.dateFin >= :dateDebut', { dateDebut, dateFin });
      } else if (dateDebut) {
        qb.andWhere('reservation.dateFin >= :dateDebut', { dateDebut });
      } else if (dateFin) {
        qb.andWhere('reservation.dateDebut <= :dateFin', { dateFin });
      }

      return qb.orderBy('reservation.dateDebut', 'ASC').addOrderBy('reservation.heureDebut', 'ASC').getMany();
    }

    const qb = this.repo
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.salle', 'salle')
      .leftJoinAndSelect('salle.etage', 'etage')
      .leftJoinAndSelect('etage.hotel', 'hotel')
      .leftJoinAndSelect('reservation.entreprise', 'entreprise');

    if (dateDebut && dateFin) {
      qb.where('reservation.dateDebut <= :dateFin AND reservation.dateFin >= :dateDebut', { dateDebut, dateFin });
    } else if (dateDebut) {
      qb.where('reservation.dateFin >= :dateDebut', { dateDebut });
    } else if (dateFin) {
      qb.where('reservation.dateDebut <= :dateFin', { dateFin });
    }

    return qb.orderBy('reservation.dateDebut', 'ASC').addOrderBy('reservation.heureDebut', 'ASC').getMany();
  }

  async trouverParId(id: number, hotelId?: number): Promise<Reservation> {
    const r = await this.repo.findOne({ where: { id }, relations: ['salle', 'salle.etage'] });
    if (!r) throw new NotFoundException('Réservation introuvable');
    if (hotelId && r.salle?.etage?.hotelId !== hotelId) throw new ForbiddenException('Accès refusé');
    return r;
  }

  async modifier(id: number, dto: ModifierReservationDto, hotelId?: number): Promise<Reservation> {
    const reservation = await this.trouverParId(id, hotelId);

    const salleId           = dto.salleId           ?? reservation.salleId;
    const entrepriseId      = dto.entrepriseId       ?? reservation.entrepriseId;
    const dateDebut         = dto.dateDebut          ?? reservation.dateDebut;
    const dateFin           = dto.dateFin            ?? reservation.dateFin;
    const estJourneeEntiere = dto.estJourneeEntiere  ?? reservation.estJourneeEntiere;
    const heureDebut        = estJourneeEntiere ? null : (dto.heureDebut ?? reservation.heureDebut);
    const heureFin          = estJourneeEntiere ? null : (dto.heureFin  ?? reservation.heureFin);
    const notes             = dto.notes  !== undefined ? dto.notes  : reservation.notes;
    const statut            = dto.statut !== undefined ? dto.statut : reservation.statut;

    if (dateDebut > dateFin) {
      throw new BadRequestException('La date de début doit être avant ou égale à la date de fin');
    }
    if (!estJourneeEntiere) {
      if (!heureDebut || !heureFin) {
        throw new BadRequestException('heureDebut et heureFin sont requis pour un créneau');
      }
      if (heureDebut >= heureFin) {
        throw new BadRequestException("L'heure de début doit être avant l'heure de fin");
      }
    }

    await this.verifierAppartenance(salleId, hotelId);
    await this.verifierConflit(
      { salleId, entrepriseId, dateDebut, dateFin, estJourneeEntiere, heureDebut, heureFin } as CreerReservationDto,
      id,
    );

    await this.repo.update(id, { salleId, entrepriseId, dateDebut, dateFin, estJourneeEntiere, heureDebut, heureFin, notes, statut });
    return this.trouverParId(id);
  }

  async supprimer(id: number, hotelId?: number): Promise<void> {
    const r = await this.trouverParId(id, hotelId);
    await this.repo.remove(r);
  }
}
