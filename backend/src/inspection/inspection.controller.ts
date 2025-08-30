
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  ParseIntPipe, 
  HttpStatus, 
  UseGuards, 
  Req 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { InspectionService } from './inspection.service';
import { 
  CreateInspectionDto, 
  UpdateInspectionDto, 
  CloturerInspectionDto, 
  ValiderInspectionDto, 
  RejeterInspectionDto,
  ReprogrammerInspectionDto
} from './dto/inspection.dto';
import { Inspection, EtatInspection } from '../entities/inspection.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleUtilisateur } from '../entities/utilisateur.entity';

@ApiTags('Inspections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/inspections')
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  @Get()
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.MAITRE_OUVRAGE, RoleUtilisateur.OPERATEUR)
  @ApiOperation({ summary: 'Récupérer toutes les inspections avec pagination et filtres' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Rechercher par titre' })
  @ApiQuery({ name: 'etat', required: false, enum: EtatInspection, description: 'Filtrer par état' })
  @ApiQuery({ name: 'idType', required: false, type: Number, description: 'Filtrer par type d\'inspection' })
  @ApiQuery({ name: 'dateDebut', required: false, type: String, description: 'Date de début de la période' })
  @ApiQuery({ name: 'dateFin', required: false, type: String, description: 'Date de fin de la période' })
  @ApiResponse({ status: 200, description: 'Liste paginée et filtrée des inspections.' })
   async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('etat') etat?: EtatInspection,
    @Query('idType') idType?: number,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
  ) {
    try {
      const result = await this.inspectionService.findAll({ 
        page: +page, 
        limit: +limit,
        search,
        etat,
        idType: idType ? +idType : undefined,
        dateDebut,
        dateFin,
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
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.MAITRE_OUVRAGE, RoleUtilisateur.OPERATEUR)
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
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.MAITRE_OUVRAGE)
  @ApiOperation({ summary: 'Créer une nouvelle inspection' })
  @ApiResponse({ status: 201, description: 'L\'inspection a été créée avec succès.', type: Inspection })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  @ApiResponse({ status: 500, description: 'Erreur serveur.' })
  async create(
    @Body() createInspectionDto: CreateInspectionDto,
    @Req() req: any
  ) {
    try {
      // Get real user ID from JWT token
      const userId = req.user.id;
      
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

  @Get(':id')
@Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.MAITRE_OUVRAGE, RoleUtilisateur.OPERATEUR)
@ApiOperation({ summary: 'Récupérer une inspection par ID avec ses relations' })
@ApiParam({ name: 'id', description: 'ID de l\'inspection', type: Number })
@ApiResponse({ status: 200, description: 'Inspection trouvée avec ses relations.' })
@ApiResponse({ status: 404, description: 'Inspection non trouvée.' })
async findOne(@Param('id', ParseIntPipe) id: number) {
  try {
    const inspection = await this.inspectionService.findOne(id);

    return {
      success: true,
      data: inspection
    };
  } catch (error) {
    return {
      success: false,
      message: 'Inspection non trouvée',
      error: error.message
    };
  }
}

@Get(':id/livrables')
@Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.MAITRE_OUVRAGE, RoleUtilisateur.OPERATEUR)
@ApiOperation({ summary: 'Récupérer les livrables d\'une inspection' })
@ApiParam({ name: 'id', description: 'ID de l\'inspection', type: Number })
@ApiResponse({ status: 200, description: 'Liste des livrables de l\'inspection.' })
async getLivrables(@Param('id', ParseIntPipe) id: number) {
  try {
    // Pour l'instant, retourner un tableau vide car vous n'avez pas encore d'entité Livrable
    return {
      success: true,
      data: []
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erreur lors de la récupération des livrables',
      error: error.message
    };
  }
}

@Get(':id/historique')
@Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.MAITRE_OUVRAGE, RoleUtilisateur.OPERATEUR)
@ApiOperation({ summary: 'Récupérer l\'historique d\'une inspection' })
@ApiParam({ name: 'id', description: 'ID de l\'inspection', type: Number })
@ApiResponse({ status: 200, description: 'Historique des modifications de l\'inspection.' })
async getHistorique(@Param('id', ParseIntPipe) id: number) {
  try {
    // Pour l'instant, retourner un tableau vide car vous n'avez pas encore d'entité LogHistorique
    return {
      success: true,
      data: []
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erreur lors de la récupération de l\'historique',
      error: error.message
    };
  }
}

  @Patch(':id')
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.MAITRE_OUVRAGE)
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
  @Roles(RoleUtilisateur.OPERATEUR, RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Clôturer une inspection avec mise à jour des actifs' })
  @ApiParam({ name: 'id', description: 'ID de l\'inspection', type: Number })
  @ApiResponse({ status: 200, description: 'L\'inspection a été clôturée.', type: Inspection })
  @ApiResponse({ status: 400, description: 'L\'inspection ne peut pas être clôturée.' })
  @ApiResponse({ status: 404, description: 'Inspection non trouvée.' })
  async cloturer(
    @Param('id', ParseIntPipe) id: number,
    @Body() cloturerDto: CloturerInspectionDto,
    @Req() req: any
  ) {
    try {
      // Get real user ID from JWT token (populated by JwtStrategy.validate())
      const userId = req.user.id;
      
      const inspection = await this.inspectionService.cloturer(id, userId, cloturerDto);

      return {
        success: true,
        data: inspection,
        message: `Inspection clôturée avec succès par ${req.user.nom}`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la clôture',
        error: error.message
      };
    }
  }

  @Post(':id/demarrer')
@Roles(RoleUtilisateur.OPERATEUR, RoleUtilisateur.ADMIN)
@ApiOperation({ summary: 'Démarrer une inspection programmée' })
@ApiParam({ name: 'id', description: 'ID de l\'inspection', type: Number })
@ApiResponse({ status: 200, description: 'L\'inspection a été démarrée.', type: Inspection })
async demarrer(
  @Param('id', ParseIntPipe) id: number,
  @Req() req: any
) {
  try {
    const userId = req.user.id;
    const inspection = await this.inspectionService.demarrer(id, userId);

    return {
      success: true,
      data: inspection,
      message: `Inspection démarrée avec succès par ${req.user.nom}`
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erreur lors du démarrage',
      error: error.message
    };
  }
}

  @Post(':id/valider')
  @Roles(RoleUtilisateur.MAITRE_OUVRAGE, RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Valider une inspection clôturée' })
  @ApiParam({ name: 'id', description: 'ID de l\'inspection', type: Number })
  @ApiResponse({ status: 200, description: 'L\'inspection a été validée.', type: Inspection })
  @ApiResponse({ status: 400, description: 'L\'inspection ne peut pas être validée.' })
  @ApiResponse({ status: 404, description: 'Inspection non trouvée.' })
  async valider(
    @Param('id', ParseIntPipe) id: number,
    @Body() validerDto: ValiderInspectionDto,
    @Req() req: any
  ) {
    try {
      // Get real user ID from JWT token
      const userId = req.user.id;
      
      const inspection = await this.inspectionService.valider(id, userId, validerDto.commentaire);

      return {
        success: true,
        data: inspection,
        message: `Inspection validée avec succès par ${req.user.nom}`
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
  @Roles(RoleUtilisateur.MAITRE_OUVRAGE, RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Rejeter une inspection clôturée' })
  @ApiParam({ name: 'id', description: 'ID de l\'inspection', type: Number })
  @ApiResponse({ status: 200, description: 'L\'inspection a été rejetée.', type: Inspection })
  @ApiResponse({ status: 400, description: 'L\'inspection ne peut pas être rejetée.' })
  @ApiResponse({ status: 404, description: 'Inspection non trouvée.' })
  async rejeter(
    @Param('id', ParseIntPipe) id: number,
    @Body() rejeterDto: RejeterInspectionDto,
    @Req() req: any
  ) {
    try {
      // Get real user ID from JWT token
      const userId = req.user.id;
      
      const inspection = await this.inspectionService.rejeter(id, userId, rejeterDto.motif);

      return {
        success: true,
        data: inspection,
        message: `Inspection rejetée avec succès par ${req.user.nom}`
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
  @Roles(RoleUtilisateur.OPERATEUR, RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Reprogrammer une inspection rejetée' })
  @ApiParam({ name: 'id', description: 'ID de l\'inspection', type: Number })
  @ApiResponse({ status: 200, description: 'L\'inspection a été reprogrammée.', type: Inspection })
  @ApiResponse({ status: 400, description: 'L\'inspection ne peut pas être reprogrammée.' })
  @ApiResponse({ status: 404, description: 'Inspection non trouvée.' })
  async reprogrammer(
    @Param('id', ParseIntPipe) id: number,
    @Body() reprogrammerDto: ReprogrammerInspectionDto,
    @Req() req: any
  ) {
    try {
      // Get real user ID from JWT token
      const userId = req.user.id;
      
      const inspection = await this.inspectionService.reprogrammer(
        id, 
        new Date(reprogrammerDto.nouvelleDate), 
        userId
      );

      return {
        success: true,
        data: inspection,
        message: `Inspection reprogrammée avec succès par ${req.user.nom}`
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
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.MAITRE_OUVRAGE, RoleUtilisateur.OPERATEUR)
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
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.MAITRE_OUVRAGE)
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
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.MAITRE_OUVRAGE)
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

  //  Get current user's inspections
  @Get('my-inspections')
  @Roles(RoleUtilisateur.OPERATEUR, RoleUtilisateur.MAITRE_OUVRAGE, RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Récupérer les inspections de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Inspections de l\'utilisateur connecté.' })
  async getMyInspections(@Req() req: any) {
    try {
      const userId = req.user.id;
      const inspections = await this.inspectionService.getInspectionsOperateur(userId);

      return {
        success: true,
        data: inspections,
        message: `Inspections de ${req.user.nom}`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la récupération des inspections',
        error: error.message
      };
    }
  }

  
}