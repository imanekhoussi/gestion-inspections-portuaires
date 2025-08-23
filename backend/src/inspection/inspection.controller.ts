import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { InspectionService } from './inspection.service';
import { 
  CreateInspectionDto, 
  UpdateInspectionDto, 
  CloturerInspectionDto, 
  ValiderInspectionDto, 
  RejeterInspectionDto,
  ReprogrammerInspectionDto
} from './dto/inspection.dto';
import { Inspection } from '../entities/inspection.entity';

@ApiTags('Inspections')
@Controller('admin/inspections')
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les inspections avec pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Éléments par page', example: 10 })
  @ApiResponse({ status: 200, description: 'Liste paginée des inspections.' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    try {
      const result = await this.inspectionService.findAll({ 
        page: +page, 
        limit: +limit 
      });

      return {
        success: true,
        data: result.data,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          lastPage: result.lastPage
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la récupération des inspections',
        error: error.message
      };
    }
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Récupérer les inspections par période pour le calendrier' })
  @ApiQuery({ name: 'startDate', type: String, description: 'Date de début (YYYY-MM-DD)', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', type: String, description: 'Date de fin (YYYY-MM-DD)', example: '2025-12-31' })
  @ApiResponse({ status: 200, description: 'Inspections de la période formatées pour calendrier.', type: [Object] })
  async findByCalendar(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    try {
      const inspections = await this.inspectionService.findByCalendar(
        new Date(startDate), 
        new Date(endDate)
      );

      return {
        success: true,
        data: inspections
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la récupération du calendrier',
        error: error.message
      };
    }
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle inspection' })
  @ApiResponse({ status: 201, description: 'L\'inspection a été créée avec succès.', type: Inspection })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  @ApiResponse({ status: 500, description: 'Erreur serveur.' })
  async create(@Body() createInspectionDto: CreateInspectionDto) {
    try {
      const userId = 1; // TODO: Récupérer le vrai userId depuis l'authentification
      
      const inspection = await this.inspectionService.create(createInspectionDto, userId);

      return {
        success: true,
        data: inspection,
        message: 'Inspection créée avec succès'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la création de l\'inspection',
        error: error.message
      };
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une inspection (mise à jour partielle)' })
  @ApiParam({ name: 'id', description: 'ID de l\'inspection', type: Number })
  @ApiResponse({ status: 200, description: 'L\'inspection a été mise à jour.', type: Inspection })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  @ApiResponse({ status: 404, description: 'Inspection non trouvée.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInspectionDto: UpdateInspectionDto
  ) {
    try {
      const inspection = await this.inspectionService.update(id, updateInspectionDto);

      return {
        success: true,
        data: inspection,
        message: 'Inspection mise à jour avec succès'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la mise à jour',
        error: error.message
      };
    }
  }

  @Post(':id/cloturer')
  @ApiOperation({ summary: 'Clôturer une inspection' })
  @ApiParam({ name: 'id', description: 'ID de l\'inspection', type: Number })
  @ApiResponse({ status: 200, description: 'L\'inspection a été clôturée.', type: Inspection })
  @ApiResponse({ status: 400, description: 'L\'inspection ne peut pas être clôturée.' })
  @ApiResponse({ status: 404, description: 'Inspection non trouvée.' })
  async cloturer(
    @Param('id', ParseIntPipe) id: number,
    @Body() cloturerDto: CloturerInspectionDto
  ) {
    try {
      const userId = 1; // TODO: Récupérer depuis l'authentification
      const inspection = await this.inspectionService.cloturer(id, userId, cloturerDto.commentaire);

      return {
        success: true,
        data: inspection,
        message: 'Inspection clôturée avec succès'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la clôture',
        error: error.message
      };
    }
  }

  @Post(':id/valider')
  @ApiOperation({ summary: 'Valider une inspection clôturée' })
  @ApiParam({ name: 'id', description: 'ID de l\'inspection', type: Number })
  @ApiResponse({ status: 200, description: 'L\'inspection a été validée.', type: Inspection })
  @ApiResponse({ status: 400, description: 'L\'inspection ne peut pas être validée.' })
  @ApiResponse({ status: 404, description: 'Inspection non trouvée.' })
  async valider(
    @Param('id', ParseIntPipe) id: number,
    @Body() validerDto: ValiderInspectionDto
  ) {
    try {
      const userId = 1; // TODO: Récupérer depuis l'authentification
      const inspection = await this.inspectionService.valider(id, userId, validerDto.commentaire);

      return {
        success: true,
        data: inspection,
        message: 'Inspection validée avec succès'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la validation',
        error: error.message
      };
    }
  }

  @Post(':id/rejeter')
  @ApiOperation({ summary: 'Rejeter une inspection clôturée' })
  @ApiParam({ name: 'id', description: 'ID de l\'inspection', type: Number })
  @ApiResponse({ status: 200, description: 'L\'inspection a été rejetée.', type: Inspection })
  @ApiResponse({ status: 400, description: 'L\'inspection ne peut pas être rejetée.' })
  @ApiResponse({ status: 404, description: 'Inspection non trouvée.' })
  async rejeter(
    @Param('id', ParseIntPipe) id: number,
    @Body() rejeterDto: RejeterInspectionDto
  ) {
    try {
      const userId = 1; // TODO: Récupérer depuis l'authentification
      const inspection = await this.inspectionService.rejeter(id, userId, rejeterDto.motif);

      return {
        success: true,
        data: inspection,
        message: 'Inspection rejetée avec succès'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors du rejet',
        error: error.message
      };
    }
  }

  @Post(':id/reprogrammer')
  @ApiOperation({ summary: 'Reprogrammer une inspection rejetée' })
  @ApiParam({ name: 'id', description: 'ID de l\'inspection', type: Number })
  @ApiResponse({ status: 200, description: 'L\'inspection a été reprogrammée.', type: Inspection })
  @ApiResponse({ status: 400, description: 'L\'inspection ne peut pas être reprogrammée.' })
  @ApiResponse({ status: 404, description: 'Inspection non trouvée.' })
  async reprogrammer(
    @Param('id', ParseIntPipe) id: number,
    @Body() reprogrammerDto: ReprogrammerInspectionDto
  ) {
    try {
      const userId = 1; // TODO: Récupérer depuis l'authentification
      const inspection = await this.inspectionService.reprogrammer(
        id, 
        new Date(reprogrammerDto.nouvelleDate), 
        userId
      );

      return {
        success: true,
        data: inspection,
        message: 'Inspection reprogrammée avec succès'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la reprogrammation',
        error: error.message
      };
    }
  }

  @Get('by-zone')
  @ApiOperation({ summary: 'Inspections par zone géographique' })
  @ApiQuery({ name: 'site', required: false, description: 'Filtrer par site' })
  @ApiQuery({ name: 'zone', required: false, description: 'Filtrer par zone' })
  @ApiResponse({ status: 200, description: 'Inspections filtrées par zone.' })
  async findByZone(
    @Query('site') site?: string,
    @Query('zone') zone?: string
  ) {
    try {
      const inspections = await this.inspectionService.findByZone(site, zone);

      return {
        success: true,
        data: inspections
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la récupération par zone',
        error: error.message
      };
    }
  }

  @Get('planification-map')
  @ApiOperation({ summary: 'Données de planification pour carte' })
  @ApiResponse({ status: 200, description: 'Inspections avec localisation pour carte.' })
  async getPlanificationMap() {
    try {
      const data = await this.inspectionService.getPlanificationMap();

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la récupération des données cartographiques',
        error: error.message
      };
    }
  }

  @Get('operateur/:operateurId/inspections-locales')
  @ApiOperation({ summary: 'Inspections assignées à un opérateur avec localisation' })
  @ApiParam({ name: 'operateurId', description: 'ID de l\'opérateur', type: Number })
  @ApiResponse({ status: 200, description: 'Inspections de l\'opérateur avec données géographiques.' })
  async getInspectionsOperateur(@Param('operateurId', ParseIntPipe) operateurId: number) {
    try {
      const inspections = await this.inspectionService.getInspectionsOperateur(operateurId);

      return {
        success: true,
        data: inspections
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la récupération des inspections de l\'opérateur',
        error: error.message
      };
    }
  }
}