// src/famille/famille.service.ts - REMPLACER COMPLÈTEMENT

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Famille } from '../entities/famille.entity';
import { CreateFamilleDto, UpdateFamilleDto } from './dto/famille.dto';
import { LogHistoriqueService } from '../log-historique/log-historique.service';
import { TypeAction, TypeEntite } from '../entities/log-historique.entity';

@Injectable()
export class FamilleService {
  constructor(
    @InjectRepository(Famille)
    private familleRepository: Repository<Famille>,
    private logService: LogHistoriqueService,
  ) {}

  async findAll(): Promise<Famille[]> {
    return this.familleRepository.find({
      relations: ['groupes', 'groupes.actifs'],
    });
  }

  async findOne(id: number): Promise<Famille> {
    const famille = await this.familleRepository.findOne({
      where: { id },
      relations: ['groupes', 'groupes.actifs'],
    });
    
    if (!famille) {
      throw new NotFoundException(`Famille avec l'ID ${id} non trouvée`);
    }
    
    return famille;
  }

  async create(createFamilleDto: CreateFamilleDto, createdBy: number): Promise<Famille> {
    const famille = this.familleRepository.create(createFamilleDto);
    const savedFamille = await this.familleRepository.save(famille);

    // Log de création
    await this.logService.enregistrerLog(
      TypeAction.CREATION,
      TypeEntite.FAMILLE,
      savedFamille.id,
      createdBy,
      null,
      { nom: savedFamille.nom, code: savedFamille.code },
      `Création de la famille ${savedFamille.nom}`
    );

    return savedFamille;
  }

  async update(id: number, updateFamilleDto: UpdateFamilleDto, updatedBy: number): Promise<Famille> {
    const famille = await this.findOne(id);
    const ancienEtat = { nom: famille.nom, code: famille.code };
    
    await this.familleRepository.update(id, updateFamilleDto);
    const updatedFamille = await this.findOne(id);

    // Log de modification
    await this.logService.enregistrerLog(
      TypeAction.MODIFICATION,
      TypeEntite.FAMILLE,
      id,
      updatedBy,
      ancienEtat,
      { nom: updatedFamille.nom, code: updatedFamille.code },
      `Modification de la famille ${updatedFamille.nom}`
    );

    return updatedFamille;
  }

  async remove(id: number, deletedBy: number): Promise<void> {
    const famille = await this.findOne(id);
    
    // Log de suppression
    await this.logService.enregistrerLog(
      TypeAction.SUPPRESSION,
      TypeEntite.FAMILLE,
      id,
      deletedBy,
      { nom: famille.nom, code: famille.code, nbGroupes: famille.groupes.length },
      null,
      `Suppression de la famille ${famille.nom}`
    );

    const result = await this.familleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Famille avec l'ID ${id} non trouvée`);
    }
  }
}
