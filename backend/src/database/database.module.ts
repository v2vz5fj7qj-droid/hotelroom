import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Etage } from '../etages/etage.entity';
import { Salle } from '../salles/salle.entity';
import { Entreprise } from '../entreprises/entreprise.entity';
import { DatabaseSeeder } from './database.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([Etage, Salle, Entreprise])],
  providers: [DatabaseSeeder],
})
export class DatabaseModule {}
