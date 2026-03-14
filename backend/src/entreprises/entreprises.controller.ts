import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { EntreprisesService } from './entreprises.service';
import { CreerEntrepriseDto } from './dto/creer-entreprise.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('entreprises')
export class EntreprisesController {
  constructor(private readonly service: EntreprisesService) {}

  @Get()
  trouverToutes() {
    return this.service.trouverToutes();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  creer(@Body() dto: CreerEntrepriseDto) {
    return this.service.creer(dto);
  }

  @Get(':id')
  trouverParId(@Param('id') id: string) {
    return this.service.trouverParId(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  modifier(@Param('id') id: string, @Body() dto: Partial<CreerEntrepriseDto> & { actif?: boolean }) {
    return this.service.modifier(+id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  supprimer(@Param('id') id: string) {
    return this.service.supprimer(+id);
  }
}
