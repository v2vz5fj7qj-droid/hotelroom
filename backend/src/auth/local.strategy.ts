import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email', passwordField: 'motDePasse' });
  }

  async validate(email: string, motDePasse: string) {
    const utilisateur = await this.authService.validerUtilisateur(email, motDePasse);
    if (!utilisateur) throw new UnauthorizedException('Identifiants invalides');
    return utilisateur;
  }
}
