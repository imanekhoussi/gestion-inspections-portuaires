import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ActifService } from './actif.service';
import { CreateActifDto, UpdateActifDto } from './dto/actif.dto';
import { Actif } from '../entities/actif.entity';

@ApiTags('Actifs') // Section "Actifs" dans Swagger
@Controller('actifs')
export class ActifController {
  constructor(private readonly actifService: ActifService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel actif (équipement)' })
  @ApiResponse({ status: 201, description: 'L\'actif a été créé avec succès.', type: Actif })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  create(@Body() createActifDto: CreateActifDto) {
    return this.actifService.create(createActifDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les actifs du port' })
  @ApiResponse({ status: 200, description: 'Liste de tous les actifs.', type: [Actif] })
  findAll() {
    return this.actifService.findAll();
  }

  @Get('by-site')
  @ApiOperation({ summary: 'Récupérer les actifs par site' })
  @ApiQuery({ name: 'site', type: String, description: 'Nom du site (ex: Port de Tanger Med)' })
  @ApiResponse({ status: 200, description: 'Actifs du site.', type: [Actif] })
  findBySite(@Query('site') site: string) {
    return this.actifService.findBySite(site);
  }

  @Get('by-groupe/:idGroupe')
  @ApiOperation({ summary: 'Récupérer les actifs d\'un groupe' })
  @ApiResponse({ status: 200, description: 'Actifs du groupe.', type: [Actif] })
  findByGroupe(@Param('idGroupe') idGroupe: string) {
    return this.actifService.findByGroupe(+idGroupe);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un actif par ID' })
  @ApiResponse({ status: 200, description: 'L\'actif trouvé.', type: Actif })
  @ApiResponse({ status: 404, description: 'Actif non trouvé.' })
  findOne(@Param('id') id: string) {
    return this.actifService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un actif' })
  @ApiResponse({ status: 200, description: 'L\'actif a été mis à jour.', type: Actif })
  @ApiResponse({ status: 404, description: 'Actif non trouvé.' })
  update(@Param('id') id: string, @Body() updateActifDto: UpdateActifDto) {
    return this.actifService.update(+id, updateActifDto);
  }

  @Patch(':id/indice-etat')
  @ApiOperation({ summary: 'Mettre à jour l\'indice d\'état d\'un actif' })
  @ApiResponse({ status: 200, description: 'L\'indice d\'état a été mis à jour.', type: Actif })
  @ApiResponse({ status: 404, description: 'Actif non trouvé.' })
  updateIndiceEtat(
    @Param('id') id: string, 
    @Body() body: { indiceEtat: number }
  ) {
    return this.actifService.updateIndiceEtat(+id, body.indiceEtat);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un actif' })
  @ApiResponse({ status: 200, description: 'L\'actif a été supprimé.' })
  @ApiResponse({ status: 404, description: 'Actif non trouvé.' })
  remove(@Param('id') id: string) {
    return this.actifService.remove(+id);
  }
}