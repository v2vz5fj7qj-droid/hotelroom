import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsInt, MinLength } from 'class-validator';
import { Role } from '../../auth/roles.enum';

export class CreerUtilisateurDto {
  @IsNotEmpty({ message: 'Le prénom est requis' })
  prenom: string;

  @IsNotEmpty({ message: 'Le nom est requis' })
  nom: string;

  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  motDePasse: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Rôle invalide' })
  role?: Role;

  @IsOptional()
  @IsInt()
  hotelId?: number;
}
