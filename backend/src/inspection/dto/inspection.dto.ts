import { IsString, IsNotEmpty, IsNumber, IsDateString, IsArray, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { EtatInspection } from '../../entities/inspection.entity';

export class CreateInspectionDto {
  @ApiProperty({ description: 'Titre de l\'inspection' })
  @IsString()
  @IsNotEmpty()
  titre: string;

  @ApiProperty({ description: 'ID du type d\'inspection' })
  @IsNumber()
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value))
  idType: number;

  @ApiProperty({ description: 'Date de début planifiée (ISO string)' })
  @IsDateString()
  dateDebut: string;

  @ApiProperty({ description: 'Date de fin planifiée (ISO string)' })
  @IsDateString()
  dateFin: string;

  @ApiProperty({ 
    type: [Number], 
    description: 'IDs des actifs à inspecter',
    required: false,
    example: [1, 2, 3]
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @Transform(({ value }) => {
    if (!value) return [];
    return Array.isArray(value) ? value.map(id => parseInt(id)) : [parseInt(value)];
  })
  actifIds?: number[];

  @ApiProperty({ description: 'Commentaire optionnel', required: false })
  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class UpdateInspectionDto extends PartialType(CreateInspectionDto) {}

export class UpdateEtatInspectionDto {
  @ApiProperty({ enum: EtatInspection, description: 'Nouvel état de l\'inspection' })
  @IsEnum(EtatInspection)
  etat: EtatInspection;

  @ApiProperty({ required: false, description: 'Commentaire sur le changement d\'état' })
  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class CloturerInspectionDto {
  @ApiProperty({ required: false, description: 'Commentaire de clôture' })
  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class ValiderInspectionDto {
  @ApiProperty({ required: false, description: 'Commentaire de validation' })
  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class RejeterInspectionDto {
  @ApiProperty({ description: 'Motif du rejet' })
  @IsString()
  @IsNotEmpty()
  motifRejet: string;

  // Alias for compatibility with your controller
  get motif(): string {
    return this.motifRejet;
  }
}

export class ReprogrammerInspectionDto {
  @ApiProperty({ description: 'Nouvelle date de début (ISO string)' })
  @IsDateString()
  nouvelleDate: string;

  @ApiProperty({ required: false, description: 'Commentaire sur la reprogrammation' })
  @IsOptional()
  @IsString()
  commentaire?: string;
}