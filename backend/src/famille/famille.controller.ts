// src/famille/famille.controller.ts 

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FamilleService } from './famille.service';
import { CreateFamilleDto, UpdateFamilleDto } from './dto/famille.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleUtilisateur } from '../entities/utilisateur.entity';

@ApiTags('Familles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/familles')
export class FamilleController {
  constructor(private readonly familleService: FamilleService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les familles' })
  findAll() {
    return this.familleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une famille par ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.familleService.findOne(id);
  }

  @Post()
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Créer une nouvelle famille (Admin seulement)' })
  create(@Body() createFamilleDto: CreateFamilleDto, @Req() req: any) {
    return this.familleService.create(createFamilleDto, req.user.id);
  }

  @Patch(':id')
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour une famille (Admin seulement)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateFamilleDto: UpdateFamilleDto, @Req() req: any) {
    return this.familleService.update(id, updateFamilleDto, req.user.id);
  }

  @Delete(':id')
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Supprimer une famille (Admin seulement)' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.familleService.remove(id, req.user.id);
  }
}