import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('configuration')
export class Configuration {
  @PrimaryColumn()
  cle: string;

  @Column({ type: 'longtext' })
  valeur: string;

  @UpdateDateColumn()
  misAJourLe: Date;
}
