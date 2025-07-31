// src/famille/dto/famille.dto.ts
import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateFamilleDto {
  @ApiProperty({ description: 'Nom de la famille', example: 'Infrastructures maritimes' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  nom: string;

  @ApiProperty({ description: 'Code unique de la famille', example: 'INFRA_MAR' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  code: string;
}

export class UpdateFamilleDto extends PartialType(CreateFamilleDto) {}
