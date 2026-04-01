import { Controller, Get, Put, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('configuration')
export class ConfigurationController {
  constructor(private readonly service: ConfigurationService) {}

  // Lecture publique : l'écran d'affichage passe ?hotelId=X sans token
  @Get(':cle')
  async lire(@Param('cle') cle: string, @Query('hotelId') hotelId?: string) {
    const hId = hotelId ? +hotelId : 0;
    const valeur = await this.service.lire(cle, hId);
    return { cle, valeur };
  }

  // Écriture réservée aux admins — hotelId vient du JWT
  @Put(':cle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HOTEL_ADMIN)
  async sauvegarder(
    @Param('cle') cle: string,
    @Body() body: { valeur: string },
    @Request() req: any,
  ) {
    await this.service.sauvegarder(cle, req.user.hotelId, body.valeur);
    return { ok: true };
  }
}
