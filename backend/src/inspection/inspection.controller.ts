import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InspectionService } from './inspection.service';
import { CreateInspectionDto, UpdateInspectionDto, CloturerInspectionDto, ValiderInspectionDto, RejeterInspectionDto } from './dto/inspection.dto';
import { Inspection, EtatInspection } from '../entities/inspection.entity';

@ApiTags('Inspections')
@Controller('admin/inspections')
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  // Replace your findAll method in inspection.controller.ts:
@Get()
findAll(
  @Query('page') page: string = '1',
  @Query('limit') limit: string = '10', 
  @Query('search') search?: string,
  @Query('idType') idType?: string,
  @Query('etat') etat?: EtatInspection,
  @Query('dateMin') dateMin?: string,
  @Query('dateMax') dateMax?: string,
  @Query('sortBy') sortBy?: string,
  @Query('sortOrder') sortOrder?: string
) {
  try {
    const options = {
      page: Math.max(parseInt(page) || 1, 1),
      limit: Math.min(Math.max(parseInt(limit) || 10, 1), 100),
      search: search?.trim() || undefined,
      idType: idType ? parseInt(idType) : undefined,
      etat,
      dateMin: dateMin ? new Date(dateMin) : undefined,
      dateMax: dateMax ? new Date(dateMax) : undefined,
      sortBy: sortBy || 'id',
      sortOrder: (sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC'
    };

    console.log('Controller processed options:', options);
    return this.inspectionService.findAll(options);
  } catch (error) {
    console.error('Controller error:', error);
    throw error;
  }
}

  @Get('calendar')
  @ApiOperation({ summary: 'Récupérer les inspections par période (calendrier)' })
  @ApiQuery({ name: 'startDate', type: String, description: 'Date de début (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', type: String, description: 'Date de fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Inspections de la période.', type: [Inspection] })
  findByCalendar(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.inspectionService.findByCalendar(new Date(startDate), new Date(endDate));
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle inspection' })
  @ApiResponse({ status: 201, description: 'L\'inspection a été créée avec succès.', type: Inspection })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  create(@Body() createInspectionDto: CreateInspectionDto) {
    // TODO: Récupérer le vrai userId depuis l'authentification
    const userId = 1; // Temporaire pour les tests
    return this.inspectionService.create(createInspectionDto, userId);
  }

  @Post(':id/cloturer')
  @ApiOperation({ summary: 'Clôturer une inspection' })
  @ApiResponse({ status: 200, description: 'L\'inspection a été clôturée.', type: Inspection })
  @ApiResponse({ status: 400, description: 'L\'inspection ne peut pas être clôturée.' })
  @ApiResponse({ status: 404, description: 'Inspection non trouvée.' })
  cloturer(
    @Param('id') id: string,
    @Body() cloturerDto: CloturerInspectionDto
  ) {
    // TODO: Récupérer le vrai userId depuis l'authentification
    const userId = 1; // Temporaire pour les tests
    return this.inspectionService.cloturer(+id, userId, cloturerDto.commentaire);
  }

  @Post(':id/valider')
  @ApiOperation({ summary: 'Valider une inspection clôturée' })
  @ApiResponse({ status: 200, description: 'L\'inspection a été validée.', type: Inspection })
  @ApiResponse({ status: 400, description: 'L\'inspection ne peut pas être validée.' })
  @ApiResponse({ status: 404, description: 'Inspection non trouvée.' })
  valider(
    @Param('id') id: string,
    @Body() validerDto: ValiderInspectionDto
  ) {
    // TODO: Récupérer le vrai userId depuis l'authentification
    const userId = 1; // Temporaire pour les tests
    return this.inspectionService.valider(+id, userId, validerDto.commentaire);
  }

  @Post(':id/rejeter')
  @ApiOperation({ summary: 'Rejeter une inspection clôturée' })
  @ApiResponse({ status: 200, description: 'L\'inspection a été rejetée.', type: Inspection })
  @ApiResponse({ status: 400, description: 'L\'inspection ne peut pas être rejetée.' })
  @ApiResponse({ status: 404, description: 'Inspection non trouvée.' })
  rejeter(
    @Param('id') id: string,
    @Body() rejeterDto: RejeterInspectionDto
  ) {
    // TODO: Récupérer le vrai userId depuis l'authentification
    const userId = 1; // Temporaire pour les tests
    return this.inspectionService.rejeter(+id, userId, rejeterDto.motif);
  }

  @Post(':id/reprogrammer')
  @ApiOperation({ summary: 'Reprogrammer une inspection rejetée' })
  @ApiResponse({ status: 200, description: 'L\'inspection a été reprogrammée.', type: Inspection })
  @ApiResponse({ status: 400, description: 'L\'inspection ne peut pas être reprogrammée.' })
  @ApiResponse({ status: 404, description: 'Inspection non trouvée.' })
  reprogrammer(
    @Param('id') id: string,
    @Body() body: { nouvelleDate: string }
  ) {
    // TODO: Récupérer le vrai userId depuis l'authentification
    const userId = 1; // Temporaire pour les tests
    return this.inspectionService.reprogrammer(+id, new Date(body.nouvelleDate), userId);
  }

  @Get('by-zone')
  @ApiOperation({ summary: 'Inspections par zone géographique' })
  @ApiQuery({ name: 'site', required: false, description: 'Filtrer par site' })
  @ApiQuery({ name: 'zone', required: false, description: 'Filtrer par zone' })
  findByZone(
    @Query('site') site?: string,
    @Query('zone') zone?: string
  ) {
    return this.inspectionService.findByZone(site, zone);
  }

  @Get('planification-map')
  @ApiOperation({ summary: 'Données de planification pour carte' })
  @ApiResponse({ status: 200, description: 'Inspections avec localisation' })
  getPlanificationMap() {
    return this.inspectionService.getPlanificationMap();
  }

  @Get('operateur/:operateurId/inspections-locales')
  @ApiOperation({ summary: 'Inspections assignées à un opérateur avec localisation' })
  getInspectionsOperateur(@Param('operateurId') operateurId: string) {
    return this.inspectionService.getInspectionsOperateur(+operateurId);
  }
}