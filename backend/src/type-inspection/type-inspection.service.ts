// src/type-inspection/type-inspection.service.ts - VÉRIFIER QUE VOUS AVEZ CE CODE

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeInspection } from '../entities/type-inspection.entity';
import { CreateTypeInspectionDto, UpdateTypeInspectionDto } from './dto/type-inspection.dto';
import { LogHistoriqueService } from '../log-historique/log-historique.service';
import { TypeAction, TypeEntite } from '../entities/log-historique.entity';

@Injectable()
export class TypeInspectionService {
  constructor(
    @InjectRepository(TypeInspection)
    private typeInspectionRepository: Repository<TypeInspection>,
    private logService: LogHistoriqueService,
  ) {}

  async create(createTypeInspectionDto: CreateTypeInspectionDto, createdBy: number): Promise<TypeInspection> {
    const typeInspection = this.typeInspectionRepository.create(createTypeInspectionDto);
    const savedType = await this.typeInspectionRepository.save(typeInspection);

    // Log de création
    await this.logService.enregistrerLog(
      TypeAction.CREATION,
      TypeEntite.TYPE_INSPECTION,
      savedType.id,
      createdBy,
      null,
      { nom: savedType.nom, frequence: savedType.frequence, idGroupe: savedType.idGroupe },
      `Création du type d'inspection ${savedType.nom}`
    );

    return savedType;
  }

  async findAll(): Promise<TypeInspection[]> {
    return await this.typeInspectionRepository.find({
      relations: ['groupe', 'groupe.famille']
    });
  }

  async findOne(id: number): Promise<TypeInspection> {
    const typeInspection = await this.typeInspectionRepository.findOne({
      where: { id },
      relations: ['groupe', 'groupe.famille']
    });
    
    if (!typeInspection) {
      throw new NotFoundException(`Type d'inspection avec l'ID ${id} non trouvé`);
    }
    
    return typeInspection;
  }

  async findByGroupe(idGroupe: number): Promise<TypeInspection[]> {
    return await this.typeInspectionRepository.find({
      where: { idGroupe },
      relations: ['groupe']
    });
  }

  async update(id: number, updateTypeInspectionDto: UpdateTypeInspectionDto, updatedBy: number): Promise<TypeInspection> {
    const typeInspection = await this.findOne(id);
    const ancienEtat = { nom: typeInspection.nom, frequence: typeInspection.frequence, idGroupe: typeInspection.idGroupe };
    
    Object.assign(typeInspection, updateTypeInspectionDto);
    const updatedType = await this.typeInspectionRepository.save(typeInspection);

    // Log de modification
    await this.logService.enregistrerLog(
      TypeAction.MODIFICATION,
      TypeEntite.TYPE_INSPECTION,
      id,
      updatedBy,
      ancienEtat,
      { nom: updatedType.nom, frequence: updatedType.frequence, idGroupe: updatedType.idGroupe },
      `Modification du type d'inspection ${updatedType.nom}`
    );

    return updatedType;
  }

  async remove(id: number, deletedBy: number): Promise<void> {
    const typeInspection = await this.findOne(id);
    
    // Log de suppression
    await this.logService.enregistrerLog(
      TypeAction.SUPPRESSION,
      TypeEntite.TYPE_INSPECTION,
      id,
      deletedBy,
      { nom: typeInspection.nom, frequence: typeInspection.frequence },
      null,
      `Suppression du type d'inspection ${typeInspection.nom}`
    );

    await this.typeInspectionRepository.remove(typeInspection);
  }
}