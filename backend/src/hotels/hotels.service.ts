import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel } from './hotel.entity';
import { CreerHotelDto } from './dto/creer-hotel.dto';

@Injectable()
export class HotelsService {
  constructor(
    @InjectRepository(Hotel)
    private repo: Repository<Hotel>,
  ) {}

  async creer(dto: CreerHotelDto): Promise<Hotel> {
    const existant = await this.repo.findOne({ where: { slug: dto.slug } });
    if (existant) throw new ConflictException('Ce slug est déjà utilisé');
    const hotel = this.repo.create(dto);
    return this.repo.save(hotel);
  }

  trouverTous(): Promise<Hotel[]> {
    return this.repo.find({ order: { nom: 'ASC' } });
  }

  async trouverParId(id: number): Promise<Hotel> {
    const h = await this.repo.findOne({ where: { id } });
    if (!h) throw new NotFoundException('Hôtel introuvable');
    return h;
  }

  async trouverParSlug(slug: string): Promise<Hotel> {
    const h = await this.repo.findOne({ where: { slug } });
    if (!h) throw new NotFoundException('Hôtel introuvable');
    return h;
  }

  async modifier(id: number, dto: Partial<CreerHotelDto> & { actif?: boolean }): Promise<Hotel> {
    const h = await this.trouverParId(id);
    if (dto.slug && dto.slug !== h.slug) {
      const existant = await this.repo.findOne({ where: { slug: dto.slug } });
      if (existant) throw new ConflictException('Ce slug est déjà utilisé');
    }
    Object.assign(h, dto);
    return this.repo.save(h);
  }

  async supprimer(id: number): Promise<void> {
    const h = await this.trouverParId(id);
    await this.repo.remove(h);
  }

  async statistiques(id: number): Promise<Record<string, number>> {
    const hotel = await this.repo.findOne({
      where: { id },
      relations: ['etages', 'entreprises', 'utilisateurs'],
    });
    if (!hotel) throw new NotFoundException('Hôtel introuvable');
    return {
      nbEtages: hotel.etages?.length ?? 0,
      nbEntreprises: hotel.entreprises?.length ?? 0,
      nbUtilisateurs: hotel.utilisateurs?.length ?? 0,
    };
  }
}
