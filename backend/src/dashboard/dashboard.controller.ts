import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Récupérer les KPIs du tableau de bord' })
  async getKPIs() {
    return this.dashboardService.getKPIs();
  }

  @Get('stats-famille')
  @ApiOperation({ summary: 'Statistiques par famille d\'actifs' })
  async getStatistiquesParFamille() {
    return this.dashboardService.getStatistiquesParFamille();
  }

  @Get('evolution-indices')
  @ApiOperation({ summary: 'Évolution des indices d\'état' })
  async getEvolutionIndicesEtat() {
    return this.dashboardService.getEvolutionIndicesEtat();
  }

  @Get('actifs-geojson')
  @ApiOperation({ summary: 'Données géographiques des actifs' })
  async getActifsGeoJson() {
    return this.dashboardService.getActifsGeoJson();
  }
}