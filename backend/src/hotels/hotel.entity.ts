import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Etage } from '../etages/etage.entity';
import { Entreprise } from '../entreprises/entreprise.entity';

@Entity('hotels')
export class Hotel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  adresse: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  telephone: string;

  @Column({ type: 'longtext', nullable: true })
  logoUrl: string;

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn()
  creeLe: Date;

  @OneToMany(() => Utilisateur, (u) => u.hotel)
  utilisateurs: Utilisateur[];

  @OneToMany(() => Etage, (e) => e.hotel)
  etages: Etage[];

  @OneToMany(() => Entreprise, (e) => e.hotel)
  entreprises: Entreprise[];
}
