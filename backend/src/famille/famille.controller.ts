import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FamilleService } from './famille.service';
import { CreateFamilleDto, UpdateFamilleDto } from './dto/famille.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // ✅ CORRECTION: chemin complet vers guards

@ApiTags('Familles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('familles')
export class FamilleController {
  constructor(private readonly familleService: FamilleService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les familles' })
  findAll() {
    return this.familleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une famille par ID' })
  findOne(@Param('id') id: string) {
    return this.familleService.findOne(+id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle famille' })
  create(@Body() createFamilleDto: CreateFamilleDto) {
    return this.familleService.create(createFamilleDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une famille' })
  update(@Param('id') id: string, @Body() updateFamilleDto: UpdateFamilleDto) {
    return this.familleService.update(+id, updateFamilleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une famille' })
  remove(@Param('id') id: string) {
    return this.familleService.remove(+id);
  }
}