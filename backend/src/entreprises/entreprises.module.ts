import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entreprise } from './entreprise.entity';
import { EntreprisesService } from './entreprises.service';
import { EntreprisesController } from './entreprises.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Entreprise])],
  providers: [EntreprisesService],
  controllers: [EntreprisesController],
  exports: [EntreprisesService],
})
export class EntreprisesModule {}
