import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreerReservationDto } from './dto/creer-reservation.dto';
import { ModifierReservationDto } from './dto/modifier-reservation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  // Public: visible sans authentification
  @Get()
  trouverToutes(
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
  ) {
    return this.service.trouverToutes(dateDebut, dateFin);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  creer(@Body() dto: CreerReservationDto, @Request() req: any) {
    return this.service.creer(dto, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  modifier(@Param('id') id: string, @Body() dto: ModifierReservationDto) {
    return this.service.modifier(+id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  supprimer(@Param('id') id: string) {
    return this.service.supprimer(+id);
  }
}
