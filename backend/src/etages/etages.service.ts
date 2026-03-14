import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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

  async creer(dto: CreerEtageDto): Promise<Etage> {
    const existant = await this.repo.findOne({ where: { numero: dto.numero } });
    if (existant) throw new ConflictException(`L'étage ${dto.numero} existe déjà`);
    const etage = this.repo.create(dto);
    return this.repo.save(etage);
  }

  trouverTous(): Promise<Etage[]> {
    return this.repo.find({ order: { numero: 'ASC' }, relations: ['salles'] });
  }

  async trouverParId(id: number): Promise<Etage> {
    const e = await this.repo.findOne({ where: { id }, relations: ['salles'] });
    if (!e) throw new NotFoundException('Étage introuvable');
    return e;
  }

  async modifier(id: number, dto: Partial<CreerEtageDto>): Promise<Etage> {
    const e = await this.trouverParId(id);
    Object.assign(e, dto);
    return this.repo.save(e);
  }

  async supprimer(id: number): Promise<void> {
    const e = await this.trouverParId(id);
    await this.repo.remove(e);
  }
}
