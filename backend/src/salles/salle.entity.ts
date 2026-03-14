import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Etage } from '../etages/etage.entity';
import { Reservation } from '../reservations/reservation.entity';

@Entity('salles')
export class Salle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  @Column()
  capacite: number;

  @Column({ default: true })
  actif: boolean;

  @ManyToOne(() => Etage, (etage) => etage.salles, { eager: true })
  @JoinColumn({ name: 'etageId' })
  etage: Etage;

  @Column()
  etageId: number;

  @CreateDateColumn()
  creeLe: Date;

  @OneToMany(() => Reservation, (r) => r.salle)
  reservations: Reservation[];
}
