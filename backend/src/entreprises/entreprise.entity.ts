import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Reservation } from '../reservations/reservation.entity';

@Entity('entreprises')
export class Entreprise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nom: string;

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn()
  creeLe: Date;

  @OneToMany(() => Reservation, (r) => r.entreprise)
  reservations: Reservation[];
}
