import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Reservation } from '../reservations/reservation.entity';
import { Hotel } from '../hotels/hotel.entity';

@Entity('entreprises')
@Unique(['nom', 'hotelId'])
export class Entreprise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  @Column()
  hotelId: number;

  @ManyToOne(() => Hotel, (h) => h.entreprises, { eager: false })
  @JoinColumn({ name: 'hotelId' })
  hotel: Hotel;

  // Coordonnées
  @Column({ type: 'varchar', nullable: true, default: null })
  telephone: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  email: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  adresse: string;

  // Identification
  @Column({ type: 'varchar', nullable: true, default: null })
  secteur: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  numeroIFU: string;

  // Personne de contact
  @Column({ type: 'varchar', nullable: true, default: null })
  contactNom: string;

  // Notes libres
  @Column({ type: 'text', nullable: true, default: null })
  notes: string;

  // Logo (base64)
  @Column({ type: 'longtext', nullable: true, default: null })
  logoUrl: string;

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn()
  creeLe: Date;

  @OneToMany(() => Reservation, (r) => r.entreprise)
  reservations: Reservation[];
}
