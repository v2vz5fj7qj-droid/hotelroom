import { IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreerEntrepriseDto {
  @IsNotEmpty({ message: "Le nom de l'entreprise est requis" })
  nom: string;

  @IsOptional()
  telephone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email invalide' })
  email?: string;

  @IsOptional()
  adresse?: string;

  @IsOptional()
  secteur?: string;

  @IsOptional()
  numeroIFU?: string;

  @IsOptional()
  contactNom?: string;

  @IsOptional()
  notes?: string;

  @IsOptional()
  logoUrl?: string;
}
