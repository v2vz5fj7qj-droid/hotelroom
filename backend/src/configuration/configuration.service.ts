import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuration } from './configuration.entity';

@Injectable()
export class ConfigurationService {
  constructor(
    @InjectRepository(Configuration)
    private repo: Repository<Configuration>,
  ) {}

  async lire(cle: string, hotelId: number): Promise<string | null> {
    const config = await this.repo.findOne({ where: { cle, hotelId } });
    return config?.valeur ?? null;
  }

  async sauvegarder(cle: string, hotelId: number, valeur: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { cle, hotelId } });
    if (existing) {
      await this.repo.update(existing.id, { valeur });
    } else {
      await this.repo.save(this.repo.create({ cle, hotelId, valeur }));
    }
  }
}
