import { IsInt, IsNotEmpty, IsOptional, Min, Max } from 'class-validator';

export class CreerEtageDto {
  @IsInt()
  @Min(0)
  @Max(50)
  numero: number;

  @IsNotEmpty({ message: 'Le nom de l\'étage est requis' })
  nom: string;

  @IsOptional()
  @IsInt()
  hotelId?: number;
}
