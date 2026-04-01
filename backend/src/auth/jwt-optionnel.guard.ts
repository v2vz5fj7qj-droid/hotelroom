import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard JWT optionnel : peuple req.user si un token valide est présent,
 * mais laisse passer les requêtes anonymes sans erreur.
 */
@Injectable()
export class JwtOptionnelGuard extends AuthGuard('jwt') {
  handleRequest(_err: any, user: any) {
    return user ?? null;
  }
}
