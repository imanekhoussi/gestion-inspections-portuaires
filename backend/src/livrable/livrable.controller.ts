// src/livrable/livrable.controller.ts - REMPLACER COMPLÈTEMENT
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LivrableService } from './livrable.service';
import { CreateLivrableDto, UpdateLivrableDto } from './dto/livrable.dto';
import { Livrable } from '../entities/livrable.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Livrables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('livrables')
export class LivrableController {
  constructor(private readonly livrableService: LivrableService) {}

  @Post()
  @ApiOperation({ summary: 'Ajouter un livrable à une inspection' })
  create(@Body() createLivrableDto: CreateLivrableDto, @Req() req: any) {
    return this.livrableService.create(createLivrableDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les livrables' })
  findAll() {
    return this.livrableService.findAll();
  }

  @Get('by-inspection/:idInspection')
  @ApiOperation({ summary: 'Récupérer les livrables d\'une inspection' })
  findByInspection(@Param('idInspection') idInspection: string) {
    return this.livrableService.findByInspection(+idInspection);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un livrable par ID' })
  findOne(@Param('id') id: string) {
    return this.livrableService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un livrable' })
  update(@Param('id') id: string, @Body() updateLivrableDto: UpdateLivrableDto, @Req() req: any) {
    return this.livrableService.update(+id, updateLivrableDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un livrable' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.livrableService.remove(+id, req.user.id);
  }
}
