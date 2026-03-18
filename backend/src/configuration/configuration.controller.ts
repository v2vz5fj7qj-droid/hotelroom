import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('configuration')
export class ConfigurationController {
  constructor(private readonly service: ConfigurationService) {}

  // Lecture publique (l'écran public en a besoin sans token)
  @Get(':cle')
  async lire(@Param('cle') cle: string) {
    const valeur = await this.service.lire(cle);
    return { cle, valeur };
  }

  // Écriture réservée aux admins
  @Put(':cle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async sauvegarder(@Param('cle') cle: string, @Body() body: { valeur: string }) {
    await this.service.sauvegarder(cle, body.valeur);
    return { ok: true };
  }
}
