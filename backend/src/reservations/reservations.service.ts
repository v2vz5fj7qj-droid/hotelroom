import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Reservation } from './reservation.entity';
import { CreerReservationDto } from './dto/creer-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private repo: Repository<Reservation>,
  ) {}

  private async verifierConflit(dto: CreerReservationDto, excludeId?: number): Promise<void> {
    const reservationsExistantes = await this.repo.find({
      where: { salleId: dto.salleId, date: dto.date },
    });

    const candidats = reservationsExistantes.filter((r) => r.id !== excludeId);

    for (const existante of candidats) {
      // Journée entière existante bloque tout
      if (existante.estJourneeEntiere) {
        throw new ConflictException(
          `La salle est déjà réservée pour la journée entière par ${existante.entreprise.nom}`,
        );
      }

      // Nouvelle réservation journée entière bloque si quelque chose existe
      if (dto.estJourneeEntiere) {
        throw new ConflictException(
          `La salle a déjà des réservations ce jour-là (${existante.heureDebut}–${existante.heureFin})`,
        );
      }

      // Chevauchement de créneaux: début < fin_existante ET fin > début_existant
      if (dto.heureDebut && dto.heureFin && existante.heureDebut && existante.heureFin) {
        const debutNouveau = dto.heureDebut;
        const finNouveau = dto.heureFin;
        const debutExistant = existante.heureDebut;
        const finExistante = existante.heureFin;

        if (debutNouveau < finExistante && finNouveau > debutExistant) {
          throw new ConflictException(
            `Conflit: la salle est déjà réservée de ${debutExistant} à ${finExistante} par ${existante.entreprise.nom}`,
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

  async supprimer(id: number): Promise<void> {
    const r = await this.trouverParId(id);
    await this.repo.remove(r);
  }
}
