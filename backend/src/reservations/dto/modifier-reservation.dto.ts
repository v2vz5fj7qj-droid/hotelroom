import { IsDateString, IsInt, IsBoolean, IsOptional, IsEnum, ValidateIf, Matches } from 'class-validator';
import { StatutReservation } from '../statut-reservation.enum';

export class ModifierReservationDto {
  @IsOptional()
  @IsInt()
  salleId?: number;

  @IsOptional()
  @IsInt()
  entrepriseId?: number;

  @IsOptional()
  @IsDateString({}, { message: 'La date de début doit être au format YYYY-MM-DD' })
  dateDebut?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de fin doit être au format YYYY-MM-DD' })
  dateFin?: string;

  @IsOptional()
  @IsBoolean()
  estJourneeEntiere?: boolean;

  @ValidateIf((o) => o.estJourneeEntiere === false)
  @IsOptional()
  @Matches(/^([0-1]\d|2[0-3]):(00|30)$/, {
    message: "L'heure doit être un créneau de 30 min (ex: 09:00, 14:30)",
  })
  heureDebut?: string;

  @ValidateIf((o) => o.estJourneeEntiere === false)
  @IsOptional()
  @Matches(/^([0-1]\d|2[0-3]):(00|30)$/, {
    message: "L'heure de fin doit être un créneau de 30 min (ex: 09:30, 15:00)",
  })
  heureFin?: string;

  @IsOptional()
  notes?: string;

  @IsOptional()
  @IsEnum(StatutReservation)
  statut?: StatutReservation;
}
