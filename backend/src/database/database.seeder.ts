import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Etage } from '../etages/etage.entity';
import { Salle } from '../salles/salle.entity';
import { Entreprise } from '../entreprises/entreprise.entity';

@Injectable()
export class DatabaseSeeder implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeeder.name);

  constructor(
    @InjectRepository(Etage) private etagesRepo: Repository<Etage>,
    @InjectRepository(Salle) private sallesRepo: Repository<Salle>,
    @InjectRepository(Entreprise) private entreprisesRepo: Repository<Entreprise>,
  ) {}

  async onModuleInit() {
    const nbEtages = await this.etagesRepo.count();
    if (nbEtages > 0) return; // Données déjà présentes

    this.logger.log('Base de données vide — chargement des données initiales...');

    // --- Étages ---
    const etages = await this.etagesRepo.save([
      { numero: 0, nom: 'Hall Principal' },
      { numero: 1, nom: 'Aile des Conférences' },
      { numero: 2, nom: 'Centre d\'Affaires' },
      { numero: 3, nom: 'Espace Prestige' },
    ]);

    const [rdc, etage1, etage2, etage3] = etages;

    // --- Salles ---
    await this.sallesRepo.save([
      // RDC — Hall Principal
      { nom: 'Salle Ouagadougou',    capacite: 150, etageId: rdc.id },
      { nom: 'Salle Volta',           capacite: 40,  etageId: rdc.id },
      // Étage 1 — Aile des Conférences
      { nom: 'Salle Nakambé',         capacite: 25,  etageId: etage1.id },
      { nom: 'Salle Mouhoun',         capacite: 20,  etageId: etage1.id },
      { nom: 'Salle Comoé',           capacite: 12,  etageId: etage1.id },
      // Étage 2 — Centre d'Affaires
      { nom: 'Boardroom Kadiogo',     capacite: 10,  etageId: etage2.id },
      { nom: 'Salle Innovation Sahel',capacite: 30,  etageId: etage2.id },
      { nom: 'Salle Faso Hub',        capacite: 18,  etageId: etage2.id },
      // Étage 3 — Espace Prestige
      { nom: 'Suite Yennenga',        capacite: 8,   etageId: etage3.id },
      { nom: 'Salon Naba Koom',       capacite: 6,   etageId: etage3.id },
    ]);

    // --- Entreprises ---
    await this.entreprisesRepo.save([
      { nom: 'ONATEL Burkina' },
      { nom: 'Coris Bank International' },
      { nom: 'Air Burkina' },
      { nom: 'SONABHY' },
      { nom: 'Ecobank Burkina Faso' },
      { nom: 'BRAKINA Brasseries' },
      { nom: 'Orange Burkina Faso' },
      { nom: 'Société Générale Burkina' },
      { nom: 'SOFITEX' },
      { nom: 'Burkina Shell' },
    ]);

    this.logger.log('Données initiales chargées : 4 étages, 10 salles, 10 entreprises.');
  }
}
