import { IsDateString, IsInt, IsBoolean, IsOptional, ValidateIf, Matches } from 'class-validator';

export class CreerReservationDto {
  @IsInt()
  salleId: number;

  @IsInt()
  entrepriseId: number;

  @IsDateString({}, { message: 'La date doit être au format YYYY-MM-DD' })
  date: string;

  @IsBoolean()
  estJourneeEntiere: boolean;

  @ValidateIf((o) => !o.estJourneeEntiere)
  @Matches(/^([0-1]\d|2[0-3]):(00|30)$/, {
    message: 'L\'heure doit être un créneau de 30 min (ex: 09:00, 14:30)',
  })
  heureDebut?: string;

  @ValidateIf((o) => !o.estJourneeEntiere)
  @Matches(/^([0-1]\d|2[0-3]):(00|30)$/, {
    message: 'L\'heure de fin doit être un créneau de 30 min (ex: 09:30, 15:00)',
  })
  heureFin?: string;

  @IsOptional()
  notes?: string;
}
