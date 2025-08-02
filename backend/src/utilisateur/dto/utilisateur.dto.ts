// src/utilisateur/dto/utilisateur.dto.ts

import { IsString, IsNotEmpty, IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { RoleUtilisateur } from '../../entities/utilisateur.entity';

export class CreateUtilisateurDto {
  @ApiProperty({ description: 'Nom complet de l\'utilisateur' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ description: 'Email unique' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Mot de passe (min 6 caractères)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: RoleUtilisateur, description: 'Rôle de l\'utilisateur' })
  @IsEnum(RoleUtilisateur)
  role: RoleUtilisateur;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  photoProfil?: string;
}

export class UpdateUtilisateurDto extends PartialType(CreateUtilisateurDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
