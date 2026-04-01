import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { CreerHotelDto } from './dto/creer-hotel.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('hotels')
export class HotelsController {
  constructor(private readonly service: HotelsService) {}

  // Public : l'écran d'affichage a besoin de résoudre le slug
  @Get('slug/:slug')
  trouverParSlug(@Param('slug') slug: string) {
    return this.service.trouverParSlug(slug);
  }

  // SUPER_ADMIN uniquement pour les autres opérations
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  trouverTous() {
    return this.service.trouverTous();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  creer(@Body() dto: CreerHotelDto) {
    return this.service.creer(dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  trouverParId(@Param('id') id: string) {
    return this.service.trouverParId(+id);
  }

  @Get(':id/statistiques')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  statistiques(@Param('id') id: string) {
    return this.service.statistiques(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  modifier(@Param('id') id: string, @Body() dto: Partial<CreerHotelDto> & { actif?: boolean }) {
    return this.service.modifier(+id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  supprimer(@Param('id') id: string) {
    return this.service.supprimer(+id);
  }
}
