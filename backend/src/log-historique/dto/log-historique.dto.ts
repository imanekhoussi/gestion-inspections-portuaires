import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TypeAction, TypeEntite } from '../../entities/log-historique.entity';

export class CreateLogHistoriqueDto {
  @ApiProperty({ enum: TypeAction })
  @IsEnum(TypeAction)
  typeAction: TypeAction;

  @ApiProperty({ enum: TypeEntite })
  @IsEnum(TypeEntite)
  typeEntite: TypeEntite;

  @ApiProperty()
  @IsNumber()
  entiteId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ancienEtat?: string | null; // ✅ CORRECTION: accepter null

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nouvelEtat?: string | null; // ✅ CORRECTION: accepter null

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  commentaire?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  detailsSupplementaires?: any;
}

export class FilterLogHistoriqueDto {
  @ApiProperty({ enum: TypeAction, required: false })
  @IsOptional()
  @IsEnum(TypeAction)
  typeAction?: TypeAction;

  @ApiProperty({ enum: TypeEntite, required: false })
  @IsOptional()
  @IsEnum(TypeEntite)
  typeEntite?: TypeEntite;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  interventionPar?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dateDebut?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dateFin?: string;
}
