// src/livrable/dto/livrable.dto.ts

import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateLivrableDto {
  @ApiProperty()
  @IsNumber()
  idInspection: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  originalName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentName: string;

  @ApiProperty()
  @IsNumber()
  taille: number;
}

export class UpdateLivrableDto extends PartialType(CreateLivrableDto) {}