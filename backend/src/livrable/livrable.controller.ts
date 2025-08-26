// src/livrable/livrable.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Req, 
  UseInterceptors, 
  UploadedFile, 
  UploadedFiles,
  BadRequestException 
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { LivrableService } from './livrable.service';
import { CreateLivrableDto, UpdateLivrableDto } from './dto/livrable.dto';
import { Livrable } from '../entities/livrable.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleUtilisateur } from '../entities/utilisateur.entity';

// Configuration Multer
const multerConfig = {
  storage: diskStorage({
    destination: './uploads/livrables',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + extname(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    // Autoriser tous types de fichiers pour les livrables d'inspection
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/zip'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Type de fichier non autorisé'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
};

@ApiTags('Livrables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('livrables')
export class LivrableController {
  constructor(private readonly livrableService: LivrableService) {}

  @Post('upload/:inspectionId')
  @Roles(RoleUtilisateur.OPERATEUR, RoleUtilisateur.ADMIN)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: 'Upload un fichier livrable pour une inspection' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Fichier uploadé avec succès', type: Livrable })
  async uploadFile(
    @Param('inspectionId') inspectionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const createDto: CreateLivrableDto = {
      idInspection: +inspectionId,
      originalName: file.originalname,
      currentName: file.filename,
      taille: file.size
    };

    return this.livrableService.create(createDto, req.user.id);
  }

  @Post('upload-multiple/:inspectionId')
  @Roles(RoleUtilisateur.OPERATEUR, RoleUtilisateur.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig)) // Max 10 fichiers
  @ApiOperation({ summary: 'Upload plusieurs fichiers livrables pour une inspection' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Fichiers uploadés avec succès', type: [Livrable] })
  async uploadMultipleFiles(
    @Param('inspectionId') inspectionId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const livrables: Livrable[] = [];
    for (const file of files) {
      const createDto: CreateLivrableDto = {
        idInspection: +inspectionId,
        originalName: file.originalname,
        currentName: file.filename,
        taille: file.size
      };
      
      const livrable = await this.livrableService.create(createDto, req.user.id);
      livrables.push(livrable);
    }

    return livrables;
  }

  @Get()
  @Roles(RoleUtilisateur.ADMIN, RoleUtilisateur.MAITRE_OUVRAGE)
  @ApiOperation({ summary: 'Récupérer tous les livrables' })
  @ApiResponse({ status: 200, description: 'Liste des livrables', type: [Livrable] })
  findAll() {
    return this.livrableService.findAll();
  }

  @Get('by-inspection/:inspectionId')
  @Roles(RoleUtilisateur.OPERATEUR, RoleUtilisateur.MAITRE_OUVRAGE, RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Récupérer les livrables d\'une inspection' })
  @ApiResponse({ status: 200, description: 'Livrables de l\'inspection', type: [Livrable] })
  findByInspection(@Param('inspectionId') inspectionId: string) {
    return this.livrableService.findByInspection(+inspectionId);
  }

  @Get(':id')
  @Roles(RoleUtilisateur.OPERATEUR, RoleUtilisateur.MAITRE_OUVRAGE, RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Récupérer un livrable par ID' })
  @ApiResponse({ status: 200, description: 'Détails du livrable', type: Livrable })
  findOne(@Param('id') id: string) {
    return this.livrableService.findOne(+id);
  }

  @Get(':id/download')
  @Roles(RoleUtilisateur.OPERATEUR, RoleUtilisateur.MAITRE_OUVRAGE, RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Télécharger un fichier livrable' })
  async downloadFile(@Param('id') id: string) {
    return this.livrableService.downloadFile(+id);
  }

  @Patch(':id')
  @Roles(RoleUtilisateur.OPERATEUR, RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour un livrable' })
  @ApiResponse({ status: 200, description: 'Livrable mis à jour', type: Livrable })
  update(@Param('id') id: string, @Body() updateLivrableDto: UpdateLivrableDto) {
    return this.livrableService.update(+id, updateLivrableDto);
  }

  @Delete(':id')
  @Roles(RoleUtilisateur.OPERATEUR, RoleUtilisateur.ADMIN)
  @ApiOperation({ summary: 'Supprimer un livrable' })
  @ApiResponse({ status: 200, description: 'Livrable supprimé' })
  remove(@Param('id') id: string) {
    return this.livrableService.remove(+id);
  }
}