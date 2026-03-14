import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Etage } from './etage.entity';
import { EtagesService } from './etages.service';
import { EtagesController } from './etages.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Etage])],
  providers: [EtagesService],
  controllers: [EtagesController],
  exports: [EtagesService],
})
export class EtagesModule {}
