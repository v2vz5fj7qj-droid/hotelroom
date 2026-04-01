import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Salle } from '../salles/salle.entity';
import { Hotel } from '../hotels/hotel.entity';

@Entity('etages')
export class Etage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  numero: number;

  @Column()
  nom: string;

  @Column()
  hotelId: number;

  @ManyToOne(() => Hotel, (h) => h.etages, { eager: false })
  @JoinColumn({ name: 'hotelId' })
  hotel: Hotel;

  @CreateDateColumn()
  creeLe: Date;

  @OneToMany(() => Salle, (salle) => salle.etage)
  salles: Salle[];
}
