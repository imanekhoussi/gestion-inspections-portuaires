import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLogHistoriqueDto {
  @ApiProperty()
  @IsNumber()
  inspectionId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ancienEtat?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nouvelEtat?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class FilterLogHistoriqueDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  interventionPar?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  inspectionId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dateDebut?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dateFin?: string;
}