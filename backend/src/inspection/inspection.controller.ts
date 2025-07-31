import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InspectionService } from './inspection.service';
import { CreateInspectionDto, UpdateInspectionDto, CloturerInspectionDto, ValiderInspectionDto, RejeterInspectionDto } from './dto/inspection.dto';
import { Inspection } from '../entities/inspection.entity';

@ApiTags('Inspections') // Section "Inspections" dans Swagger
@Controller('inspections')
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les inspections' })
  @ApiResponse({ status: 200, description: 'Liste de toutes les inspections.', type: [Inspection] })
  findAll() {
    return this.inspectionService.findAll();
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
}