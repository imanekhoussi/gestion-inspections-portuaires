// src/log-historique/log-historique.controller.ts

import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LogHistoriqueService } from './log-historique.service';
import { FilterLogHistoriqueDto } from './dto/log-historique.dto';
import { LogHistorique, TypeEntite } from '../entities/log-historique.entity';
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
  @ApiQuery({ name: 'typeAction', required: false, description: 'Filtrer par type d\'action' })
  @ApiQuery({ name: 'typeEntite', required: false, description: 'Filtrer par type d\'entité' })
  @ApiQuery({ name: 'interventionPar', required: false, description: 'Filtrer par utilisateur' })
  @ApiQuery({ name: 'dateDebut', required: false, description: 'Date de début (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateFin', required: false, description: 'Date de fin (YYYY-MM-DD)' })
  findAll(@Query() filters: FilterLogHistoriqueDto) {
    return this.logService.findAll(filters);
  }

  @Get('entite/:typeEntite/:entiteId')
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.MAITRE_OUVRAGE)
  @ApiOperation({ summary: 'Récupérer l\'historique d\'une entité spécifique' })
  @ApiResponse({ status: 200, description: 'Historique de l\'entité.', type: [LogHistorique] })
  findByEntite(
    @Param('typeEntite') typeEntite: TypeEntite,
    @Param('entiteId') entiteId: string
  ) {
    return this.logService.findByEntite(typeEntite, +entiteId);
  }

  @Get('utilisateur/:userId')
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Récupérer les actions d\'un utilisateur (Admin seulement)' })
  @ApiResponse({ status: 200, description: 'Actions de l\'utilisateur.', type: [LogHistorique] })
  findByUtilisateur(@Param('userId') userId: string) {
    return this.logService.findByUtilisateur(+userId);
  }

  @Get('statistiques')
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Statistiques des actions (Admin seulement)' })
  @ApiResponse({ status: 200, description: 'Statistiques par type d\'action.' })
  getStatistiques() {
    return this.logService.getStatistiquesActions();
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
