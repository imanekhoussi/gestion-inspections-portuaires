//  src/inspection/dto/inspection.dto.ts
import { IsString, IsNotEmpty, IsDateString, IsArray, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateInspectionDto {
  @ApiProperty({ description: 'Titre de l\'inspection' })
  @IsString()
  @IsNotEmpty()
  titre: string;

  @ApiProperty({ description: 'ID du type d\'inspection' })
  @IsNumber()
  idType: number;

  @ApiProperty({ description: 'Date de début' })
  @IsDateString()
  dateDebut: string;

  @ApiProperty({ description: 'Date de fin' })
  @IsDateString()
  dateFin: string;

  @ApiProperty({ description: 'IDs des actifs concernés' })
  @IsArray()
  @IsNumber({}, { each: true })
  actifsIds: number[];
}

export class UpdateInspectionDto extends PartialType(CreateInspectionDto) {}

export class CloturerInspectionDto {
  @ApiProperty({ description: 'Commentaire de clôture', required: false })
  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class ValiderInspectionDto {
  @ApiProperty({ description: 'Commentaire de validation', required: false })
  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class RejeterInspectionDto {
  @ApiProperty({ description: 'Motif du rejet' })
  @IsString()
  @IsNotEmpty()
  motif: string;
}
