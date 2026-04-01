import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UtilisateursModule } from './utilisateurs/utilisateurs.module';
import { EtagesModule } from './etages/etages.module';
import { SallesModule } from './salles/salles.module';
import { EntreprisesModule } from './entreprises/entreprises.module';
import { ReservationsModule } from './reservations/reservations.module';
import { DatabaseModule } from './database/database.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { HotelsModule } from './hotels/hotels.module';
import { Hotel } from './hotels/hotel.entity';
import { Utilisateur } from './utilisateurs/utilisateur.entity';
import { Etage } from './etages/etage.entity';
import { Salle } from './salles/salle.entity';
import { Entreprise } from './entreprises/entreprise.entity';
import { Reservation } from './reservations/reservation.entity';
import { Configuration } from './configuration/configuration.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST', '127.0.0.1'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get('DB_USERNAME', 'root'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_DATABASE', 'hotel_manager_db'),
        entities: [Hotel, Utilisateur, Etage, Salle, Entreprise, Reservation, Configuration],
        synchronize: true,
      }),
    }),
    DatabaseModule,
    HotelsModule,
    AuthModule,
    UtilisateursModule,
    EtagesModule,
    SallesModule,
    EntreprisesModule,
    ReservationsModule,
    ConfigurationModule,
  ],
})
export class AppModule {}
