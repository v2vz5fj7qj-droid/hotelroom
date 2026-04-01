import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
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

  async creer(dto: CreerEntrepriseDto & { hotelId: number }): Promise<Entreprise> {
    const existante = await this.repo.findOne({ where: { nom: dto.nom, hotelId: dto.hotelId } });
    if (existante) throw new ConflictException('Cette entreprise existe déjà pour cet hôtel');
    const entreprise = this.repo.create(dto);
    return this.repo.save(entreprise);
  }

  trouverToutes(hotelId?: number): Promise<Entreprise[]> {
    const where = hotelId ? { hotelId } : {};
    return this.repo.find({ where, order: { nom: 'ASC' }, relations: ['hotel'] });
  }

  async trouverParId(id: number, hotelId?: number): Promise<Entreprise> {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Entreprise introuvable');
    if (hotelId && e.hotelId !== hotelId) throw new ForbiddenException('Accès refusé');
    return e;
  }

  async modifier(id: number, dto: Partial<CreerEntrepriseDto> & { actif?: boolean }, hotelId?: number): Promise<Entreprise> {
    const e = await this.trouverParId(id, hotelId);
    Object.assign(e, dto);
    return this.repo.save(e);
  }

  async supprimer(id: number, hotelId?: number): Promise<void> {
    const e = await this.trouverParId(id, hotelId);
    await this.repo.remove(e);
  }
}
