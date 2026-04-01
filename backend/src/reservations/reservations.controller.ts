import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreerReservationDto } from './dto/creer-reservation.dto';
import { ModifierReservationDto } from './dto/modifier-reservation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtOptionnelGuard } from '../auth/jwt-optionnel.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  // Public : accepte hotelId en query param pour l'affichage public
  @Get()
  @UseGuards(JwtOptionnelGuard)
  trouverToutes(
    @Request() req: any,
    @Query('hotelId') hotelId?: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
  ) {
    const user = req?.user;
    const hId = user
      ? (user.role === Role.SUPER_ADMIN ? (hotelId ? +hotelId : undefined) : user.hotelId)
      : (hotelId ? +hotelId : undefined);
    return this.service.trouverToutes(hId, dateDebut, dateFin);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HOTEL_ADMIN)
  creer(@Body() dto: CreerReservationDto, @Request() req: any) {
    const hotelId = req.user.role === Role.SUPER_ADMIN ? undefined : req.user.hotelId;
    return this.service.creer(dto, req.user.id, hotelId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HOTEL_ADMIN)
  modifier(@Param('id') id: string, @Body() dto: ModifierReservationDto, @Request() req: any) {
    const hotelId = req.user.role === Role.SUPER_ADMIN ? undefined : req.user.hotelId;
    return this.service.modifier(+id, dto, hotelId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HOTEL_ADMIN)
  supprimer(@Param('id') id: string, @Request() req: any) {
    const hotelId = req.user.role === Role.SUPER_ADMIN ? undefined : req.user.hotelId;
    return this.service.supprimer(+id, hotelId);
  }
}
