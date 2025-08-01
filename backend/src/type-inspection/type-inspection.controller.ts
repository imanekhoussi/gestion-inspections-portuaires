// src/type-inspection/type-inspection.controller.ts - REMPLACER COMPLÈTEMENT

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TypeInspectionService } from './type-inspection.service';
import { CreateTypeInspectionDto, UpdateTypeInspectionDto } from './dto/type-inspection.dto';
import { TypeInspection } from '../entities/type-inspection.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleUtilisateur } from '../entities/utilisateur.entity';

@ApiTags('Types d\'inspection')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('types-inspection')
export class TypeInspectionController {
  constructor(private readonly typeInspectionService: TypeInspectionService) {}

  @Post()
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Créer un nouveau type d\'inspection (Admin seulement)' })
  @ApiResponse({ status: 201, description: 'Type d\'inspection créé.', type: TypeInspection })
  create(@Body() createTypeInspectionDto: CreateTypeInspectionDto, @Req() req: any) {
    return this.typeInspectionService.create(createTypeInspectionDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les types d\'inspection' })
  @ApiResponse({ status: 200, description: 'Liste des types d\'inspection.', type: [TypeInspection] })
  findAll() {
    return this.typeInspectionService.findAll();
  }

  @Get('by-groupe/:idGroupe')
  @ApiOperation({ summary: 'Récupérer les types d\'inspection d\'un groupe' })
  findByGroupe(@Param('idGroupe') idGroupe: string) {
    return this.typeInspectionService.findByGroupe(+idGroupe);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un type d\'inspection par ID' })
  findOne(@Param('id') id: string) {
    return this.typeInspectionService.findOne(+id);
  }

  @Patch(':id')
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour un type d\'inspection (Admin seulement)' })
  update(@Param('id') id: string, @Body() updateTypeInspectionDto: UpdateTypeInspectionDto, @Req() req: any) {
    return this.typeInspectionService.update(+id, updateTypeInspectionDto, req.user.id);
  }

  @Delete(':id')
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Supprimer un type d\'inspection (Admin seulement)' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.typeInspectionService.remove(+id, req.user.id);
  }
}
