import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from '../auth/roles.enum';
import { Hotel } from '../hotels/hotel.entity';

@Entity('utilisateurs')
export class Utilisateur {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  prenom: string;

  @Column()
  nom: string;

  @Column({ unique: true })
  email: string;

  @Column()
  motDePasse: string;

  @Column({ type: 'enum', enum: Role, default: Role.HOTEL_VIEWER })
  role: Role;

  @Column({ nullable: true })
  hotelId: number;

  @ManyToOne(() => Hotel, (h) => h.utilisateurs, { eager: false, nullable: true })
  @JoinColumn({ name: 'hotelId' })
  hotel: Hotel;

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn()
  creeLe: Date;
}
