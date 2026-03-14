import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SallesService } from './salles.service';
import { CreerSalleDto } from './dto/creer-salle.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('salles')
export class SallesController {
  constructor(private readonly service: SallesService) {}

  @Get()
  trouverToutes() {
    return this.service.trouverToutes();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  creer(@Body() dto: CreerSalleDto) {
    return this.service.creer(dto);
  }

  @Get(':id')
  trouverParId(@Param('id') id: string) {
    return this.service.trouverParId(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  modifier(@Param('id') id: string, @Body() dto: Partial<CreerSalleDto> & { actif?: boolean }) {
    return this.service.modifier(+id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  supprimer(@Param('id') id: string) {
    return this.service.supprimer(+id);
  }
}
