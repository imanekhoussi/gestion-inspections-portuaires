// src/type-inspection/dto/type-inspection.dto.ts

import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateTypeInspectionDto {
  @ApiProperty({ description: 'Nom du type d\'inspection', example: 'Inspection visuelle ponts' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ description: 'Fréquence d\'inspection', example: 'Mensuelle' })
  @IsString()
  @IsNotEmpty()
  frequence: string;

  @ApiProperty({ description: 'ID du groupe associé' })
  @IsNumber()
  idGroupe: number;
}

export class UpdateTypeInspectionDto extends PartialType(CreateTypeInspectionDto) {}
