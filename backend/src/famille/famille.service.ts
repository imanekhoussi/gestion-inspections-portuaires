// src/famille/famille.service.ts 

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

  /**
   * Fetches all families and adds the count of associated groups to each.
   */
  async findAll(): Promise<Famille[]> {
    // Use QueryBuilder to efficiently count related groups
    return this.familleRepository
      .createQueryBuilder('famille')
      .loadRelationCountAndMap('famille.nbGroupes', 'famille.groupes')
      .getMany();
  }

  /**
   * Fetches a single family by ID and adds the count of its groups.
   */
  async findOne(id: number): Promise<Famille> {
    const famille = await this.familleRepository
      .createQueryBuilder('famille')
      .where('famille.id = :id', { id })
      .loadRelationCountAndMap('famille.nbGroupes', 'famille.groupes')
      .getOne();

    if (!famille) {
      throw new NotFoundException(`Famille avec l'ID ${id} non trouvée`);
    }
    
    return famille;
  }

  async create(createFamilleDto: CreateFamilleDto, createdBy: number): Promise<Famille> {
    const famille = this.familleRepository.create(createFamilleDto);
    const savedFamille = await this.familleRepository.save(famille);

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
    const familleAvant = await this.findOne(id);
    const ancienEtat = { nom: familleAvant.nom, code: familleAvant.code };
    
    await this.familleRepository.update(id, updateFamilleDto);
    const familleApres = await this.findOne(id);

    await this.logService.enregistrerLog(
      TypeAction.MODIFICATION,
      TypeEntite.FAMILLE,
      id,
      updatedBy,
      ancienEtat,
      { nom: familleApres.nom, code: familleApres.code },
      `Modification de la famille ${familleApres.nom}`
    );

    return familleApres;
  }

  async remove(id: number, deletedBy: number): Promise<void> {
    const famille = await this.findOne(id);
    
    await this.logService.enregistrerLog(
      TypeAction.SUPPRESSION,
      TypeEntite.FAMILLE,
      id,
      deletedBy,
      { nom: famille.nom, code: famille.code, nbGroupes: famille.nbGroupes },
      null,
      `Suppression de la famille ${famille.nom}`
    );

    const result = await this.familleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Famille avec l'ID ${id} non trouvée`);
    }
  }
}