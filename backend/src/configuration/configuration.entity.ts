import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, Unique } from 'typeorm';

@Entity('configuration')
@Unique(['cle', 'hotelId'])
export class Configuration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cle: string;

  @Column()
  hotelId: number;

  @Column({ type: 'longtext' })
  valeur: string;

  @UpdateDateColumn()
  misAJourLe: Date;
}
