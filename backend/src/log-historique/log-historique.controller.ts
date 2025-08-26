// src/log-historique/log-historique.controller.ts

import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LogHistoriqueService } from './log-historique.service';
import { FilterLogHistoriqueDto } from './dto/log-historique.dto';
import { LogHistorique } from '../entities/log-historique.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleUtilisateur } from '../entities/utilisateur.entity';

@ApiTags('Logs & Historique')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('logs')
export class LogHistoriqueController {
  constructor(private readonly logService: LogHistoriqueService) {}

  @Get()
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.MAITRE_OUVRAGE)
  @ApiOperation({ summary: 'Récupérer tous les logs avec filtres optionnels' })
  @ApiResponse({ status: 200, description: 'Liste des logs d\'historique.', type: [LogHistorique] })
  @ApiQuery({ name: 'interventionPar', required: false, description: 'Filtrer par utilisateur' })
  @ApiQuery({ name: 'inspectionId', required: false, description: 'Filtrer par inspection' })
  @ApiQuery({ name: 'dateDebut', required: false, description: 'Date de début (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateFin', required: false, description: 'Date de fin (YYYY-MM-DD)' })
  findAll(@Query() filters: FilterLogHistoriqueDto) {
    return this.logService.findAll(filters);
  }

  @Get('inspection/:inspectionId')
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.MAITRE_OUVRAGE, RoleUtilisateur.OPERATEUR)
  @ApiOperation({ summary: 'Récupérer l\'historique d\'une inspection spécifique' })
  @ApiResponse({ status: 200, description: 'Historique de l\'inspection.', type: [LogHistorique] })
  findByInspection(@Param('inspectionId') inspectionId: string) {
    return this.logService.findByInspection(+inspectionId);
  }

  @Get('inspection/:inspectionId/chronologique')
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.MAITRE_OUVRAGE)
  @ApiOperation({ summary: 'Récupérer l\'historique chronologique d\'une inspection' })
  @ApiResponse({ status: 200, description: 'Historique chronologique de l\'inspection.', type: [LogHistorique] })
  getHistoriqueChronologique(@Param('inspectionId') inspectionId: string) {
    return this.logService.getHistoriqueChronologique(+inspectionId);
  }

  @Get('utilisateur/:userId')
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Récupérer les actions d\'un utilisateur (Admin seulement)' })
  @ApiResponse({ status: 200, description: 'Actions de l\'utilisateur.', type: [LogHistorique] })
  findByUtilisateur(@Param('userId') userId: string) {
    return this.logService.findByUtilisateur(+userId);
  }

  @Get('statistiques-etats')
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Statistiques des changements d\'états (Admin seulement)' })
  @ApiResponse({ status: 200, description: 'Statistiques des transitions d\'états.' })
  getStatistiquesEtats() {
    return this.logService.getStatistiquesEtats();
  }

  @Get('activite-recente')
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.MAITRE_OUVRAGE)
  @ApiOperation({ summary: 'Activité récente (dernières 24h)' })
  @ApiResponse({ status: 200, description: 'Activité récente.', type: [LogHistorique] })
  @ApiQuery({ name: 'heures', required: false, description: 'Nombre d\'heures à considérer (défaut: 24)' })
  getActiviteRecente(@Query('heures') heures?: string) {
    const nombreHeures = heures ? parseInt(heures) : 24;
    return this.logService.getActiviteRecente(nombreHeures);
  }
}