// src/arborescence.controller.ts

import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { FamilleService } from './famille/famille.service';

@ApiTags('Arborescence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/arborescence')
export class ArborescenceController {
  constructor(private readonly familleService: FamilleService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer l\'arborescence complète Famille → Groupe → Actifs' })
  @ApiResponse({ status: 200, description: 'Arborescence structurelle complète' })
  async getArborescenceComplete() {
    return await this.familleService.findAll();
  }
}