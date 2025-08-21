// src/groupe/groupe.controller.ts 

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GroupeService } from './groupe.service';
import { CreateGroupeDto, UpdateGroupeDto } from './dto/groupe.dto';
import { Groupe } from '../entities/groupe.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleUtilisateur } from '../entities/utilisateur.entity';

@ApiTags('Groupes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/groupes')
export class GroupeController {
  constructor(private readonly groupeService: GroupeService) {}

  @Post()
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Créer un nouveau groupe (Admin seulement)' })
  @ApiResponse({ status: 201, description: 'Le groupe a été créé avec succès.', type: Groupe })
  create(@Body() createGroupeDto: CreateGroupeDto, @Req() req: any) {
    return this.groupeService.create(createGroupeDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les groupes' })
  @ApiResponse({ status: 200, description: 'Liste de tous les groupes.', type: [Groupe] })
  findAll() {
    return this.groupeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un groupe par ID' })
  @ApiResponse({ status: 200, description: 'Le groupe trouvé.', type: Groupe })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupeService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour un groupe (Admin seulement)' })
  @ApiResponse({ status: 200, description: 'Le groupe a été mis à jour.', type: Groupe })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateGroupeDto: UpdateGroupeDto, @Req() req: any) {
    return this.groupeService.update(id, updateGroupeDto, req.user.id);
  }

  @Delete(':id')
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Supprimer un groupe (Admin seulement)' })
  @ApiResponse({ status: 200, description: 'Le groupe a été supprimé.' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.groupeService.remove(id, req.user.id);
  }
}