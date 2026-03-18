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

  async lire(cle: string): Promise<string | null> {
    const config = await this.repo.findOne({ where: { cle } });
    return config?.valeur ?? null;
  }

  async sauvegarder(cle: string, valeur: string): Promise<void> {
    await this.repo.upsert({ cle, valeur }, ['cle']);
  }
}
