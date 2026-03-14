import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Salle } from './salle.entity';
import { CreerSalleDto } from './dto/creer-salle.dto';

@Injectable()
export class SallesService {
  constructor(
    @InjectRepository(Salle)
    private repo: Repository<Salle>,
  ) {}

  async creer(dto: CreerSalleDto): Promise<Salle> {
    const salle = this.repo.create(dto);
    return this.repo.save(salle);
  }

  trouverToutes(): Promise<Salle[]> {
    return this.repo.find({ order: { etageId: 'ASC', nom: 'ASC' } });
  }

  async trouverParId(id: number): Promise<Salle> {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Salle introuvable');
    return s;
  }

  async modifier(id: number, dto: Partial<CreerSalleDto> & { actif?: boolean }): Promise<Salle> {
    const s = await this.trouverParId(id);
    Object.assign(s, dto);
    return this.repo.save(s);
  }

  async supprimer(id: number): Promise<void> {
    const s = await this.trouverParId(id);
    await this.repo.remove(s);
  }
}
