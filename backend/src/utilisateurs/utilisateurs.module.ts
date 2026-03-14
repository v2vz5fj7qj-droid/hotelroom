import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Utilisateur } from './utilisateur.entity';
import { UtilisateursService } from './utilisateurs.service';
import { UtilisateursController } from './utilisateurs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Utilisateur])],
  providers: [UtilisateursService],
  controllers: [UtilisateursController],
  exports: [UtilisateursService],
})
export class UtilisateursModule implements OnModuleInit {
  constructor(private readonly service: UtilisateursService) {}
  async onModuleInit() {
    await this.service.initialiserSuperAdmin();
  }
}
