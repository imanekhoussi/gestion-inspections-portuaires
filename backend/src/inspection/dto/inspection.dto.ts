// src/inspection/dto/inspection.dto.ts - CORRIGER LA PROPRIÉTÉ MANQUANTE

import { IsString, IsNotEmpty, IsNumber, IsDateString, IsArray, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { EtatInspection } from '../../entities/inspection.entity';

export class CreateInspectionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titre: string;

  @ApiProperty()
  @IsNumber()
  idType: number;

  @ApiProperty()
  @IsDateString()
  dateDebut: string;

  @ApiProperty()
  @IsDateString()
  dateFin: string;

  @ApiProperty({ type: [Number], description: 'IDs des actifs concernés' })
  @IsArray()
  @IsNumber({}, { each: true })
  actifIds: number[];
}

export class UpdateInspectionDto extends PartialType(CreateInspectionDto) {}

export class UpdateEtatInspectionDto {
  @ApiProperty({ enum: EtatInspection })
  @IsEnum(EtatInspection)
  etat: EtatInspection;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class CloturerInspectionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class ValiderInspectionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class RejeterInspectionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  motifRejet: string; // ✅ CORRECTION: propriété correcte

  // Alias pour compatibilité avec votre controller
  get motif(): string {
    return this.motifRejet;
  }
}