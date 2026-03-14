import { IsEnum, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { Role } from '../../auth/roles.enum';

export class ModifierUtilisateurDto {
  @IsOptional()
  prenom?: string;

  @IsOptional()
  nom?: string;

  @IsOptional()
  @MinLength(6)
  motDePasse?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
