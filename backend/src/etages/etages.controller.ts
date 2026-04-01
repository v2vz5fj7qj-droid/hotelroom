import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { EtagesService } from './etages.service';
import { CreerEtageDto } from './dto/creer-etage.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtOptionnelGuard } from '../auth/jwt-optionnel.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('etages')
export class EtagesController {
  constructor(private readonly service: EtagesService) {}

  @Get()
  @UseGuards(JwtOptionnelGuard)
  trouverTous(@Request() req: any, @Query('hotelId') hotelId?: string) {
    const user = req?.user;
    const hId = user
      ? (user.role === Role.SUPER_ADMIN ? (hotelId ? +hotelId : undefined) : user.hotelId)
      : (hotelId ? +hotelId : undefined);
    return this.service.trouverTous(hId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HOTEL_ADMIN)
  creer(@Body() dto: CreerEtageDto, @Request() req: any) {
    const hotelId: number = req.user.hotelId ?? dto.hotelId;
    return this.service.creer({ numero: dto.numero, nom: dto.nom, hotelId });
  }

  @Get(':id')
  trouverParId(@Param('id') id: string) {
    return this.service.trouverParId(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HOTEL_ADMIN)
  modifier(@Param('id') id: string, @Body() dto: Partial<CreerEtageDto>, @Request() req: any) {
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
