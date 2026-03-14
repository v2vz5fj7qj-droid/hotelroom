import { IsNotEmpty } from 'class-validator';

export class CreerEntrepriseDto {
  @IsNotEmpty({ message: 'Le nom de l\'entreprise est requis' })
  nom: string;
}
