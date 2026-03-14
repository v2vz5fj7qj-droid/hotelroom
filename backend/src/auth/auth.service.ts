import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UtilisateursService } from '../utilisateurs/utilisateurs.service';

@Injectable()
export class AuthService {
  constructor(
    private utilisateursService: UtilisateursService,
    private jwtService: JwtService,
  ) {}

  async validerUtilisateur(email: string, motDePasse: string) {
    const utilisateur = await this.utilisateursService.trouverParEmail(email);
    if (utilisateur && await bcrypt.compare(motDePasse, utilisateur.motDePasse)) {
      const { motDePasse: _, ...resultat } = utilisateur;
      return resultat;
    }
    return null;
  }

  async connexion(utilisateur: any) {
    const payload = { sub: utilisateur.id, email: utilisateur.email, role: utilisateur.role };
    return {
      access_token: this.jwtService.sign(payload),
      utilisateur: {
        id: utilisateur.id,
        email: utilisateur.email,
        prenom: utilisateur.prenom,
        nom: utilisateur.nom,
        role: utilisateur.role,
      },
    };
  }
}
