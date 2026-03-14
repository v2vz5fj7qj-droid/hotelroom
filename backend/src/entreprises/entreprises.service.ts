import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entreprise } from './entreprise.entity';
import { CreerEntrepriseDto } from './dto/creer-entreprise.dto';

@Injectable()
export class EntreprisesService {
  constructor(
    @InjectRepository(Entreprise)
    private repo: Repository<Entreprise>,
  ) {}

  async creer(dto: CreerEntrepriseDto): Promise<Entreprise> {
    const existante = await this.repo.findOne({ where: { nom: dto.nom } });
    if (existante) throw new ConflictException('Cette entreprise existe déjà');
    const entreprise = this.repo.create(dto);
    return this.repo.save(entreprise);
  }

  trouverToutes(): Promise<Entreprise[]> {
    return this.repo.find({ order: { nom: 'ASC' } });
  }

  async trouverParId(id: number): Promise<Entreprise> {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Entreprise introuvable');
    return e;
  }

  async modifier(id: number, dto: Partial<CreerEntrepriseDto> & { actif?: boolean }): Promise<Entreprise> {
    const e = await this.trouverParId(id);
    Object.assign(e, dto);
    return this.repo.save(e);
  }

  async supprimer(id: number): Promise<void> {
    const e = await this.trouverParId(id);
    await this.repo.remove(e);
  }
}
