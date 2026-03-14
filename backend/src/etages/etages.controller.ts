import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { EtagesService } from './etages.service';
import { CreerEtageDto } from './dto/creer-etage.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('etages')
export class EtagesController {
  constructor(private readonly service: EtagesService) {}

  @Get()
  trouverTous() {
    return this.service.trouverTous();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  creer(@Body() dto: CreerEtageDto) {
    return this.service.creer(dto);
  }

  @Get(':id')
  trouverParId(@Param('id') id: string) {
    return this.service.trouverParId(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  modifier(@Param('id') id: string, @Body() dto: Partial<CreerEtageDto>) {
    return this.service.modifier(+id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  supprimer(@Param('id') id: string) {
    return this.service.supprimer(+id);
  }
}
