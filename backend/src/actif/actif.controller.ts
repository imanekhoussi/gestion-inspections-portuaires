import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ActifService } from './actif.service';
import { CreateActifDto, UpdateActifDto } from './dto/actif.dto';
import { Actif } from '../entities/actif.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleUtilisateur } from '../entities/utilisateur.entity';

@ApiTags('Actifs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('actifs')
export class ActifController {
  constructor(private readonly actifService: ActifService) {}

  @Post()
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Créer un nouvel actif avec coordonnées GPS optionnelles (Admin seulement)' })
  @ApiResponse({ status: 201, description: 'L\'actif a été créé avec succès.', type: Actif })
  create(@Body() createActifDto: CreateActifDto, @Req() req: any) {
    return this.actifService.create(createActifDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les actifs du port' })
  @ApiResponse({ status: 200, description: 'Liste de tous les actifs.', type: [Actif] })
  findAll() {
    return this.actifService.findAll();
  }

  @Get('geojson')
  @ApiOperation({ summary: 'Récupérer les actifs au format GeoJSON pour la cartographie' })
  @ApiResponse({ status: 200, description: 'A GeoJSON FeatureCollection of the assets.' })
  getActifsGeoJSON(): Promise<any> {
    return this.actifService.getActifsAsGeoJSON();
  }

  @Get('by-coordinates')
  @ApiOperation({ summary: 'Récupérer les actifs dans un rayon géographique' })
  @ApiQuery({ name: 'lat', type: Number, description: 'Latitude du point central' })
  @ApiQuery({ name: 'lng', type: Number, description: 'Longitude du point central' })
  @ApiQuery({ name: 'radius', type: Number, description: 'Rayon de recherche en mètres (défaut: 1000)' })
  @ApiResponse({ status: 200, description: 'Actifs dans le rayon spécifié' })
  findByCoordinates(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 1000
  ) {
    return this.actifService.findByCoordinates(+lat, +lng, +radius);
  }

  @Get('statistics-by-zone')
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.MAITRE_OUVRAGE)
  @ApiOperation({ summary: 'Statistiques des actifs regroupées par site et zone' })
  @ApiResponse({ status: 200, description: 'Statistiques détaillées par zone' })
  getStatisticsByZone() {
    return this.actifService.getStatisticsByZone();
  }

  @Get('by-site')
  @ApiOperation({ summary: 'Récupérer les actifs d\'un site spécifique' })
  @ApiQuery({ name: 'site', type: String, description: 'Nom du site' })
  findBySite(@Query('site') site: string) {
    return this.actifService.findBySite(site);
  }

  @Get('by-groupe/:idGroupe')
  @ApiOperation({ summary: 'Récupérer les actifs d\'un groupe spécifique' })
  findByGroupe(@Param('idGroupe') idGroupe: string) {
    return this.actifService.findByGroupe(+idGroupe);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un actif par son ID' })
  findOne(@Param('id') id: string) {
    return this.actifService.findOne(+id);
  }

  @Patch(':id')
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour un actif (Admin seulement)' })
  update(@Param('id') id: string, @Body() updateActifDto: UpdateActifDto, @Req() req: any) {
    return this.actifService.update(+id, updateActifDto, req.user.id);
  }

  @Patch(':id/indice-etat')
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.MAITRE_OUVRAGE)
  @ApiOperation({ summary: 'Mettre à jour l\'indice d\'état d\'un actif' })
  updateIndiceEtat(
    @Param('id') id: string, 
    @Body() body: { indiceEtat: number },
    @Req() req: any
  ) {
    return this.actifService.updateIndiceEtat(+id, body.indiceEtat, req.user.id);
  }

  @Delete(':id')
  @Roles(RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Supprimer un actif (Admin seulement)' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.actifService.remove(+id, req.user.id);
  }
}