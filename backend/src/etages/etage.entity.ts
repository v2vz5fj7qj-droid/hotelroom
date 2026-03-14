import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Salle } from '../salles/salle.entity';

@Entity('etages')
export class Etage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  numero: number;

  @Column()
  nom: string;

  @CreateDateColumn()
  creeLe: Date;

  @OneToMany(() => Salle, (salle) => salle.etage)
  salles: Salle[];
}
