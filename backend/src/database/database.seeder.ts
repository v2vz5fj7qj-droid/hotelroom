// Le seeder ne crée plus de données d'exemple spécifiques à un hôtel.
// Le super admin est initialisé dans UtilisateursModule.onModuleInit().
// Chaque hôtel crée ses propres données via l'interface d'administration.
import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseSeeder {}
