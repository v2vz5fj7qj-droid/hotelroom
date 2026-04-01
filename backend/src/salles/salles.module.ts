import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Salle } from './salle.entity';
import { Etage } from '../etages/etage.entity';
import { SallesService } from './salles.service';
import { SallesController } from './salles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Salle, Etage])],
  providers: [SallesService],
  controllers: [SallesController],
  exports: [SallesService],
})
export class SallesModule {}
