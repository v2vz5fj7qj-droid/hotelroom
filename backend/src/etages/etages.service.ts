import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Etage } from './etage.entity';
import { CreerEtageDto } from './dto/creer-etage.dto';

@Injectable()
export class EtagesService {
  constructor(
    @InjectRepository(Etage)
    private repo: Repository<Etage>,
  ) {}

  async creer(dto: CreerEtageDto & { hotelId: number }): Promise<Etage> {
    const existant = await this.repo.findOne({ where: { numero: dto.numero, hotelId: dto.hotelId } });
    if (existant) throw new ConflictException(`L'étage ${dto.numero} existe déjà pour cet hôtel`);
    const etage = this.repo.create(dto);
    return this.repo.save(etage);
  }

  trouverTous(hotelId?: number): Promise<Etage[]> {
    const where = hotelId ? { hotelId } : {};
    return this.repo.find({ where, order: { numero: 'ASC' }, relations: ['salles', 'hotel'] });
  }

  async trouverParId(id: number, hotelId?: number): Promise<Etage> {
    const e = await this.repo.findOne({ where: { id }, relations: ['salles'] });
    if (!e) throw new NotFoundException('Étage introuvable');
    if (hotelId && e.hotelId !== hotelId) throw new ForbiddenException('Accès refusé');
    return e;
  }

  async modifier(id: number, dto: Partial<CreerEtageDto>, hotelId?: number): Promise<Etage> {
    const e = await this.trouverParId(id, hotelId);
    Object.assign(e, dto);
    return this.repo.save(e);
  }

  async supprimer(id: number, hotelId?: number): Promise<void> {
    const e = await this.trouverParId(id, hotelId);
    await this.repo.remove(e);
  }
}
