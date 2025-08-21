// src/arborescence/arborescence.controller.ts

import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ArborescenceService } from './arborescence.service';

// --- INTERFACES ADDED TO FIX THE ERROR ---
// It's good practice to move these to a shared DTO file,
// but defining them here solves the immediate problem.
interface ArborescenceNode {
  id: number;
  nom: string;
  code: string;
  type: 'famille' | 'groupe' | 'actif';
  metadata?: any;
  enfants?: ArborescenceNode[];
}

interface ArborescenceResponse {
  familles: ArborescenceNode[];
  totalFamilles: number;
  totalGroupes: number;
  totalActifs: number;
}
// -------------------------------------------

@ApiTags('Arborescence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/arborescence')
export class ArborescenceController {
  constructor(private readonly arborescenceService: ArborescenceService) {}

  @Get()
  @ApiOperation({ summary: "Récupérer l'arborescence complète Famille → Groupe → Actifs" })
  @ApiResponse({ status: 200, description: 'Arborescence structurelle complète' })
  async getArborescenceComplete(): Promise<ArborescenceResponse> {
    return this.arborescenceService.getArborescence();
  }
}