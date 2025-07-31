import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateGroupeDto {
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
  idFamille: number;
}

export class UpdateGroupeDto extends PartialType(CreateGroupeDto) {}
