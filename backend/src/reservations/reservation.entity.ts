import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Salle } from '../salles/salle.entity';
import { Entreprise } from '../entreprises/entreprise.entity';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Salle, (salle) => salle.reservations, { eager: true })
  @JoinColumn({ name: 'salleId' })
  salle: Salle;

  @Column()
  salleId: number;

  @ManyToOne(() => Entreprise, (e) => e.reservations, { eager: true })
  @JoinColumn({ name: 'entrepriseId' })
  entreprise: Entreprise;

  @Column()
  entrepriseId: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time', nullable: true })
  heureDebut: string | null;

  @Column({ type: 'time', nullable: true })
  heureFin: string | null;

  @Column({ default: false })
  estJourneeEntiere: boolean;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => Utilisateur, { eager: false, nullable: true })
  @JoinColumn({ name: 'creePar' })
  creePar: Utilisateur;

  @Column({ nullable: true })
  creeParId: number;

  @CreateDateColumn()
  creeLe: Date;
}
