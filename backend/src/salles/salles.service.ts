import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Salle } from './salle.entity';
import { Etage } from '../etages/etage.entity';
import { CreerSalleDto } from './dto/creer-salle.dto';

@Injectable()
export class SallesService {
  constructor(
    @InjectRepository(Salle)
    private repo: Repository<Salle>,
    @InjectRepository(Etage)
    private etageRepo: Repository<Etage>,
  ) {}

  async creer(dto: CreerSalleDto, hotelId?: number): Promise<Salle> {
    if (hotelId) {
      const etage = await this.etageRepo.findOne({ where: { id: dto.etageId } });
      if (!etage || etage.hotelId !== hotelId) {
        throw new ForbiddenException("Cet étage n'appartient pas à votre hôtel");
      }
    }
    const salle = this.repo.create(dto);
    return this.repo.save(salle);
  }

  trouverToutes(hotelId?: number): Promise<Salle[]> {
    const qb = this.repo
      .createQueryBuilder('salle')
      .leftJoinAndSelect('salle.etage', 'etage')
      .leftJoinAndSelect('etage.hotel', 'hotel')
      .orderBy('etage.hotelId', 'ASC')
      .addOrderBy('salle.etageId', 'ASC')
      .addOrderBy('salle.nom', 'ASC');

    if (hotelId) {
      qb.where('etage.hotelId = :hotelId', { hotelId });
    }

    return qb.getMany();
  }

  async trouverParId(id: number, hotelId?: number): Promise<Salle> {
    const s = await this.repo.findOne({ where: { id }, relations: ['etage'] });
    if (!s) throw new NotFoundException('Salle introuvable');
    if (hotelId && s.etage?.hotelId !== hotelId) throw new ForbiddenException('Accès refusé');
    return s;
  }

  async modifier(id: number, dto: Partial<CreerSalleDto> & { actif?: boolean }, hotelId?: number): Promise<Salle> {
    const s = await this.trouverParId(id, hotelId);
    Object.assign(s, dto);
    return this.repo.save(s);
  }

  async supprimer(id: number, hotelId?: number): Promise<void> {
    const s = await this.trouverParId(id, hotelId);
    await this.repo.remove(s);
  }
}
