// src/utilisateur/utilisateur.controller.ts - REMPLACER COMPLÈTEMENT

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UtilisateurService } from './utilisateur.service';
import { CreateUtilisateurDto, UpdateUtilisateurDto } from './dto/utilisateur.dto';
import { Utilisateur } from '../entities/utilisateur.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoleUtilisateur } from '../entities/utilisateur.entity';
import { Roles } from '../auth/decorators/roles.decorator';


@ApiTags('Utilisateurs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('utilisateurs')
export class UtilisateurController {
  constructor(private readonly utilisateurService: UtilisateurService) {}

  @Post()
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Créer un nouvel utilisateur (Admin seulement)' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès.', type: Utilisateur })
  create(@Body() createUtilisateurDto: CreateUtilisateurDto, @Req() req: any) {
    return this.utilisateurService.create(createUtilisateurDto, req.user.id);
  }

  @Get()
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Récupérer tous les utilisateurs (Admin seulement)' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs.', type: [Utilisateur] })
  findAll() {
    return this.utilisateurService.findAll();
  }

  @Get(':id')
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID (Admin seulement)' })
  findOne(@Param('id') id: string) {
    return this.utilisateurService.findOne(+id);
  }

  @Patch(':id')
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour un utilisateur (Admin seulement)' })
  update(@Param('id') id: string, @Body() updateUtilisateurDto: UpdateUtilisateurDto, @Req() req: any) {
    return this.utilisateurService.update(+id, updateUtilisateurDto, req.user.id);
  }

  @Delete(':id')
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Supprimer un utilisateur (Admin seulement)' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.utilisateurService.remove(+id, req.user.id);
  }
}
