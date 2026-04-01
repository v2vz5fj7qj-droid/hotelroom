import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { UtilisateursService } from './utilisateurs.service';
import { CreerUtilisateurDto } from './dto/creer-utilisateur.dto';
import { ModifierUtilisateurDto } from './dto/modifier-utilisateur.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('utilisateurs')
export class UtilisateursController {
  constructor(private readonly service: UtilisateursService) {}

  // Accessible à tout utilisateur connecté (pas de restriction de rôle)
  @Patch('moi')
  @UseGuards(JwtAuthGuard)
  modifierProfil(@Body() body: any, @Request() req: any) {
    return this.service.modifierProfil(req.user.id, body);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HOTEL_ADMIN)
  creer(@Body() dto: CreerUtilisateurDto, @Request() req: any) {
    // HOTEL_ADMIN ne peut créer des utilisateurs que pour son propre hôtel
    if (req.user.role === Role.HOTEL_ADMIN) {
      dto.hotelId = req.user.hotelId;
    }
    return this.service.creer(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HOTEL_ADMIN)
  trouverTous(@Request() req: any, @Query('hotelId') hotelId?: string) {
    // SUPER_ADMIN : peut filtrer par hôtel via query param, sinon voit tout
    if (req.user.role === Role.SUPER_ADMIN) {
      return this.service.trouverTous(hotelId ? +hotelId : undefined);
    }
    // HOTEL_ADMIN : voit uniquement son hôtel
    return this.service.trouverTous(req.user.hotelId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HOTEL_ADMIN)
  trouverParId(@Param('id') id: string, @Request() req: any) {
    const hotelId = req.user.role === Role.SUPER_ADMIN ? undefined : req.user.hotelId;
    return this.service.trouverParId(+id, hotelId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HOTEL_ADMIN)
  modifier(@Param('id') id: string, @Body() dto: ModifierUtilisateurDto, @Request() req: any) {
    return this.service.modifier(+id, dto, { role: req.user.role, hotelId: req.user.hotelId });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HOTEL_ADMIN)
  supprimer(@Param('id') id: string, @Request() req: any) {
    return this.service.supprimer(+id, { role: req.user.role, hotelId: req.user.hotelId });
  }
}
