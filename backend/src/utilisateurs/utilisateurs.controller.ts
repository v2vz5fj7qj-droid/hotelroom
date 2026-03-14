import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UtilisateursService } from './utilisateurs.service';
import { CreerUtilisateurDto } from './dto/creer-utilisateur.dto';
import { ModifierUtilisateurDto } from './dto/modifier-utilisateur.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('utilisateurs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class UtilisateursController {
  constructor(private readonly service: UtilisateursService) {}

  @Post()
  creer(@Body() dto: CreerUtilisateurDto) {
    return this.service.creer(dto);
  }

  @Get()
  trouverTous() {
    return this.service.trouverTous();
  }

  @Get(':id')
  trouverParId(@Param('id') id: string) {
    return this.service.trouverParId(+id);
  }

  @Patch(':id')
  modifier(@Param('id') id: string, @Body() dto: ModifierUtilisateurDto) {
    return this.service.modifier(+id, dto);
  }

  @Delete(':id')
  supprimer(@Param('id') id: string) {
    return this.service.supprimer(+id);
  }
}
