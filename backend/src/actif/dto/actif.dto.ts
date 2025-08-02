import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateActifDto {
  @ApiProperty({ description: 'Site où se trouve l\'actif', example: 'Port de Tanger Med' })
  @IsString()
  @IsNotEmpty()
  site: string;

  @ApiProperty({ description: 'Zone spécifique dans le site', example: 'Terminal 1' })
  @IsString()
  @IsNotEmpty()
  zone: string;

  @ApiProperty({ description: 'Type d\'ouvrage', example: 'Quai d\'accostage' })
  @IsString()
  @IsNotEmpty()
  ouvrage: string;

  @ApiProperty({ description: 'Nom de l\'actif', example: 'Grue mobile A1' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ description: 'Code unique de l\'actif', example: 'GM-A1-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'ID du groupe auquel appartient l\'actif' })
  @IsNumber()
  idGroupe: number;

  @ApiProperty({ description: 'Indice d\'état (1=critique, 5=excellent)', minimum: 1, maximum: 5, required: false })
  @IsOptional()
  @IsNumber()
  indiceEtat?: number;

  @ApiProperty({ description: 'Latitude GPS (optionnel)', example: 35.7595, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Longitude GPS (optionnel)', example: -5.8340, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class UpdateActifDto extends PartialType(CreateActifDto) {}
