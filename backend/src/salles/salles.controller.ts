import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { SallesService } from './salles.service';
import { CreerSalleDto } from './dto/creer-salle.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtOptionnelGuard } from '../auth/jwt-optionnel.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('salles')
export class SallesController {
  constructor(private readonly service: SallesService) {}

  @Get()
  @UseGuards(JwtOptionnelGuard)
  trouverToutes(@Request() req: any, @Query('hotelId') hotelId?: string) {
    const user = req?.user;
    const hId = user
      ? (user.role === Role.SUPER_ADMIN ? (hotelId ? +hotelId : undefined) : user.hotelId)
      : (hotelId ? +hotelId : undefined);
    return this.service.trouverToutes(hId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HOTEL_ADMIN)
  creer(@Body() dto: CreerSalleDto, @Request() req: any) {
    const hotelId = req.user.role === Role.SUPER_ADMIN ? undefined : req.user.hotelId;
    return this.service.creer(dto, hotelId);
  }

  @Get(':id')
  trouverParId(@Param('id') id: string) {
    return this.service.trouverParId(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HOTEL_ADMIN)
  modifier(@Param('id') id: string, @Body() dto: Partial<CreerSalleDto> & { actif?: boolean }, @Request() req: any) {
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
