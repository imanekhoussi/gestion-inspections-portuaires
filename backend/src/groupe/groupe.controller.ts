import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GroupeService } from './groupe.service';
import { CreateGroupeDto, UpdateGroupeDto } from './dto/groupe.dto';
import { Groupe } from '../entities/groupe.entity';

@ApiTags('Groupes') // Ceci créera une section "Groupes" dans Swagger
@Controller('groupe')
export class GroupeController {
  constructor(private readonly groupeService: GroupeService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau groupe' })
  @ApiResponse({ status: 201, description: 'Le groupe a été créé avec succès.', type: Groupe })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  create(@Body() createGroupeDto: CreateGroupeDto) {
    return this.groupeService.create(createGroupeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les groupes' })
  @ApiResponse({ status: 200, description: 'Liste de tous les groupes.', type: [Groupe] })
  findAll() {
    return this.groupeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un groupe par ID' })
  @ApiResponse({ status: 200, description: 'Le groupe trouvé.', type: Groupe })
  @ApiResponse({ status: 404, description: 'Groupe non trouvé.' })
  findOne(@Param('id') id: string) {
    return this.groupeService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un groupe' })
  @ApiResponse({ status: 200, description: 'Le groupe a été mis à jour.', type: Groupe })
  @ApiResponse({ status: 404, description: 'Groupe non trouvé.' })
  update(@Param('id') id: string, @Body() updateGroupeDto: UpdateGroupeDto) {
    return this.groupeService.update(+id, updateGroupeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un groupe' })
  @ApiResponse({ status: 200, description: 'Le groupe a été supprimé.' })
  @ApiResponse({ status: 404, description: 'Groupe non trouvé.' })
  remove(@Param('id') id: string) {
    return this.groupeService.remove(+id);
  }
}