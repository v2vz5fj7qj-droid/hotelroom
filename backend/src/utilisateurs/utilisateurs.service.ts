import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Utilisateur } from './utilisateur.entity';
import { CreerUtilisateurDto } from './dto/creer-utilisateur.dto';
import { ModifierUtilisateurDto } from './dto/modifier-utilisateur.dto';
import { Role } from '../auth/roles.enum';

@Injectable()
export class UtilisateursService {
  constructor(
    @InjectRepository(Utilisateur)
    private repo: Repository<Utilisateur>,
  ) {}

  async creer(dto: CreerUtilisateurDto): Promise<Omit<Utilisateur, 'motDePasse'>> {
    const existant = await this.repo.findOne({ where: { email: dto.email } });
    if (existant) throw new ConflictException('Cet email est déjà utilisé');

    const hash = await bcrypt.hash(dto.motDePasse, 10);
    const utilisateur = this.repo.create({ ...dto, motDePasse: hash });
    const sauvegarde = await this.repo.save(utilisateur);
    const { motDePasse: _, ...resultat } = sauvegarde;
    return resultat;
  }

  async trouverTous(): Promise<Omit<Utilisateur, 'motDePasse'>[]> {
    const utilisateurs = await this.repo.find({ order: { nom: 'ASC' } });
    return utilisateurs.map(({ motDePasse: _, ...u }) => u);
  }

  async trouverParEmail(email: string): Promise<Utilisateur | null> {
    return this.repo.findOne({ where: { email, actif: true } });
  }

  async trouverParId(id: number): Promise<Omit<Utilisateur, 'motDePasse'>> {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('Utilisateur introuvable');
    const { motDePasse: _, ...resultat } = u;
    return resultat;
  }

  async modifier(id: number, dto: ModifierUtilisateurDto): Promise<Omit<Utilisateur, 'motDePasse'>> {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('Utilisateur introuvable');

    if (dto.motDePasse) {
      dto.motDePasse = await bcrypt.hash(dto.motDePasse, 10);
    }
    Object.assign(u, dto);
    const sauvegarde = await this.repo.save(u);
    const { motDePasse: _, ...resultat } = sauvegarde;
    return resultat;
  }

  async supprimer(id: number): Promise<void> {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('Utilisateur introuvable');
    await this.repo.remove(u);
  }

  async initialiserSuperAdmin(): Promise<void> {
    const count = await this.repo.count();
    if (count === 0) {
      await this.creer({
        prenom: 'Super',
        nom: 'Admin',
        email: 'admin@bravia.com',
        motDePasse: 'Admin1234!',
        role: Role.SUPER_ADMIN,
      });
      console.log('Super admin créé: admin@bravia.com / Admin1234!');
    }
  }
}
