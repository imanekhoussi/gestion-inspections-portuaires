// src/actif/dto/actif.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateActifDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  site: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  zone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ouvrage: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsNumber()
  idGroupe: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  indiceEtat?: number;

  @ApiProperty()
  @IsOptional()
  geometry?: any;
}

export class UpdateActifDto extends PartialType(CreateActifDto) {}
