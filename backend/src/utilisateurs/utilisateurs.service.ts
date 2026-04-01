import { Injectable, ConflictException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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

  async trouverTous(hotelId?: number): Promise<Omit<Utilisateur, 'motDePasse'>[]> {
    const where = hotelId ? { hotelId } : {};
    const utilisateurs = await this.repo.find({ where, order: { nom: 'ASC' }, relations: ['hotel'] });
    return utilisateurs.map(({ motDePasse: _, ...u }) => u);
  }

  async trouverParEmail(email: string): Promise<Utilisateur | null> {
    return this.repo.findOne({ where: { email, actif: true }, relations: ['hotel'] });
  }

  async trouverParId(id: number, hotelId?: number): Promise<Omit<Utilisateur, 'motDePasse'>> {
    const u = await this.repo.findOne({ where: { id }, relations: ['hotel'] });
    if (!u) throw new NotFoundException('Utilisateur introuvable');
    if (hotelId && u.hotelId !== hotelId) throw new ForbiddenException('Accès refusé');
    const { motDePasse: _, ...resultat } = u;
    return resultat;
  }

  async modifier(
    id: number,
    dto: ModifierUtilisateurDto,
    contexte?: { role: string; hotelId?: number },
  ): Promise<Omit<Utilisateur, 'motDePasse'>> {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('Utilisateur introuvable');

    // HOTEL_ADMIN ne peut modifier que les utilisateurs de son hôtel
    if (contexte?.role === Role.HOTEL_ADMIN && u.hotelId !== contexte.hotelId) {
      throw new ForbiddenException('Accès refusé');
    }

    if (dto.motDePasse) {
      dto.motDePasse = await bcrypt.hash(dto.motDePasse, 10);
    }
    Object.assign(u, dto);
    const sauvegarde = await this.repo.save(u);
    const { motDePasse: _, ...resultat } = sauvegarde;
    return resultat;
  }

  async supprimer(id: number, contexte?: { role: string; hotelId?: number }): Promise<void> {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('Utilisateur introuvable');

    if (contexte?.role === Role.HOTEL_ADMIN && u.hotelId !== contexte.hotelId) {
      throw new ForbiddenException('Accès refusé');
    }

    await this.repo.remove(u);
  }

  async modifierProfil(
    id: number,
    dto: { prenom?: string; nom?: string; email?: string; ancienMotDePasse?: string; nouveauMotDePasse?: string },
  ): Promise<Omit<Utilisateur, 'motDePasse'>> {
    const u = await this.repo.findOne({ where: { id }, relations: ['hotel'] });
    if (!u) throw new NotFoundException('Utilisateur introuvable');

    if (dto.email && dto.email !== u.email) {
      const existant = await this.repo.findOne({ where: { email: dto.email } });
      if (existant) throw new ConflictException('Cet email est déjà utilisé');
    }

    if (dto.nouveauMotDePasse) {
      if (!dto.ancienMotDePasse) throw new BadRequestException('L\'ancien mot de passe est requis');
      const valide = await bcrypt.compare(dto.ancienMotDePasse, u.motDePasse);
      if (!valide) throw new BadRequestException('Ancien mot de passe incorrect');
    }

    if (dto.prenom) u.prenom = dto.prenom;
    if (dto.nom) u.nom = dto.nom;
    if (dto.email) u.email = dto.email;
    if (dto.nouveauMotDePasse) u.motDePasse = await bcrypt.hash(dto.nouveauMotDePasse, 10);

    const sauvegarde = await this.repo.save(u);
    const { motDePasse: _, ...resultat } = sauvegarde;
    return resultat;
  }

  async initialiserSuperAdmin(): Promise<void> {
    const count = await this.repo.count();
    if (count === 0) {
      await this.creer({
        prenom: 'Super',
        nom: 'Admin',
        email: 'admin@hotelmanager.com',
        motDePasse: 'Admin1234!',
        role: Role.SUPER_ADMIN,
      });
      console.log('Super admin créé : admin@hotelmanager.com / Admin1234!');
    }
  }
}
