import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class CreerSalleDto {
  @IsNotEmpty({ message: 'Le nom de la salle est requis' })
  nom: string;

  @IsInt()
  @Min(1, { message: 'La capacité doit être d\'au moins 1 personne' })
  capacite: number;

  @IsInt()
  etageId: number;
}
