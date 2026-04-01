import { IsEmail, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreerHotelDto {
  @IsNotEmpty({ message: 'Le nom est requis' })
  nom: string;

  @IsNotEmpty({ message: 'Le slug est requis' })
  @Matches(/^[a-z0-9-]+$/, { message: 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets' })
  slug: string;

  @IsOptional()
  adresse?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email invalide' })
  email?: string;

  @IsOptional()
  telephone?: string;

  @IsOptional()
  logoUrl?: string;
}
