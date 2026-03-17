import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Reservation } from './reservation.entity';
import { CreerReservationDto } from './dto/creer-reservation.dto';
import { ModifierReservationDto } from './dto/modifier-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private repo: Repository<Reservation>,
  ) {}

  private async verifierConflit(dto: CreerReservationDto, excludeId?: number): Promise<void> {
    const reservationsExistantes = await this.repo.find({
      where: { salleId: dto.salleId, date: dto.date },
      relations: ['entreprise'],
    });

    const candidats = reservationsExistantes.filter((r) => r.id !== excludeId);

    for (const existante of candidats) {
      const nomEntreprise = existante.entreprise?.nom ?? 'une autre entreprise';

      if (existante.estJourneeEntiere) {
        throw new ConflictException(
          `La salle est déjà réservée pour la journée entière par ${nomEntreprise}`,
        );
      }

      if (dto.estJourneeEntiere) {
        throw new ConflictException(
          `La salle a déjà des réservations ce jour-là (${existante.heureDebut}–${existante.heureFin})`,
        );
      }

      if (dto.heureDebut && dto.heureFin && existante.heureDebut && existante.heureFin) {
        if (dto.heureDebut < existante.heureFin && dto.heureFin > existante.heureDebut) {
          throw new ConflictException(
            `Conflit : la salle est déjà réservée de ${existante.heureDebut} à ${existante.heureFin} par ${nomEntreprise}`,
          );
        }
      }
    }
  }

  async creer(dto: CreerReservationDto, creeParId?: number): Promise<Reservation> {
    if (!dto.estJourneeEntiere) {
      if (!dto.heureDebut || !dto.heureFin) {
        throw new BadRequestException('heureDebut et heureFin sont requis pour un créneau');
      }
      if (dto.heureDebut >= dto.heureFin) {
        throw new BadRequestException('L\'heure de début doit être avant l\'heure de fin');
      }
    }

    await this.verifierConflit(dto);

    const reservation = this.repo.create({ ...dto, creeParId });
    return this.repo.save(reservation);
  }

  trouverToutes(dateDebut?: string, dateFin?: string): Promise<Reservation[]> {
    const where: any = {};
    if (dateDebut && dateFin) {
      where.date = Between(dateDebut, dateFin);
    } else if (dateDebut) {
      where.date = MoreThanOrEqual(dateDebut);
    } else if (dateFin) {
      where.date = LessThanOrEqual(dateFin);
    }
    return this.repo.find({ where, order: { date: 'ASC', heureDebut: 'ASC' } });
  }

  async trouverParId(id: number): Promise<Reservation> {
    const r = await this.repo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Réservation introuvable');
    return r;
  }

  async modifier(id: number, dto: ModifierReservationDto): Promise<Reservation> {
    const reservation = await this.trouverParId(id);

    const salleId       = dto.salleId       ?? reservation.salleId;
    const entrepriseId  = dto.entrepriseId  ?? reservation.entrepriseId;
    const date          = dto.date          ?? reservation.date;
    const estJourneeEntiere = dto.estJourneeEntiere ?? reservation.estJourneeEntiere;
    const heureDebut    = estJourneeEntiere ? null : (dto.heureDebut ?? reservation.heureDebut);
    const heureFin      = estJourneeEntiere ? null : (dto.heureFin  ?? reservation.heureFin);
    const notes         = dto.notes  !== undefined ? dto.notes  : reservation.notes;
    const statut        = dto.statut !== undefined ? dto.statut : reservation.statut;

    if (!estJourneeEntiere) {
      if (!heureDebut || !heureFin) {
        throw new BadRequestException('heureDebut et heureFin sont requis pour un créneau');
      }
      if (heureDebut >= heureFin) {
        throw new BadRequestException("L'heure de début doit être avant l'heure de fin");
      }
    }

    await this.verifierConflit(
      { salleId, entrepriseId, date, estJourneeEntiere, heureDebut, heureFin } as CreerReservationDto,
      id,
    );

    await this.repo.update(id, {
      salleId,
      entrepriseId,
      date,
      estJourneeEntiere,
      heureDebut,
      heureFin,
      notes,
      statut,
    });

    return this.trouverParId(id);
  }

  async supprimer(id: number): Promise<void> {
    const r = await this.trouverParId(id);
    await this.repo.remove(r);
  }
}
