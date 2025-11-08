// src/famille/famille.service.ts 

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Famille } from '../entities/famille.entity';
import { CreateFamilleDto, UpdateFamilleDto } from './dto/famille.dto';
import { LogHistoriqueService } from '../log-historique/log-historique.service';

@Injectable()
export class FamilleService {
  constructor(
    @InjectRepository(Famille)
    private familleRepository: Repository<Famille>,
    private logService: LogHistoriqueService,
  ) {}

  /**
   * Fetches all families and adds the count of associated groups and actifs to each.
   */
  async findAll(): Promise<Famille[]> {
    // Version simple avec logs pour debug
    const familles = await this.familleRepository
      .createQueryBuilder('famille')
      .leftJoin('famille.groupes', 'groupe')
      .leftJoin('groupe.actifs', 'actif')
      .loadRelationCountAndMap('famille.nbGroupes', 'famille.groupes')
      .loadRelationCountAndMap('famille.nbActifs', 'famille.groupes.actifs')
      .getMany();

    // Log pour debug
    console.log('🔍 Backend - Familles récupérées:', 
      familles.map(f => ({ 
        nom: f.nom, 
        nbGroupes: f['nbGroupes'], 
        nbActifs: f['nbActifs'] 
      }))
    );

    return familles;
  }

  /**
   * Fetches a single family by ID and adds the count of its groups and actifs.
   */
  async findOne(id: number): Promise<Famille> {
    const famille = await this.familleRepository
      .createQueryBuilder('famille')
      .where('famille.id = :id', { id })
      .leftJoin('famille.groupes', 'groupe')
      .leftJoin('groupe.actifs', 'actif')
      .loadRelationCountAndMap('famille.nbGroupes', 'famille.groupes')
      .loadRelationCountAndMap('famille.nbActifs', 'famille.groupes.actifs')
      .getOne();

    if (!famille) {
      throw new NotFoundException(`Famille avec l'ID ${id} non trouvée`);
    }
    
    return famille;
  }

  async create(createFamilleDto: CreateFamilleDto, createdBy: number): Promise<Famille> {
    const famille = this.familleRepository.create(createFamilleDto);
    const savedFamille = await this.familleRepository.save(famille);
    return savedFamille;
  }

  async update(id: number, updateFamilleDto: UpdateFamilleDto, updatedBy: number): Promise<Famille> {
    const familleAvant = await this.findOne(id);
    const ancienEtat = { nom: familleAvant.nom, code: familleAvant.code };
    
    await this.familleRepository.update(id, updateFamilleDto);
    const familleApres = await this.findOne(id);
    return familleApres;
  }

  async remove(id: number, deletedBy: number): Promise<void> {
    const famille = await this.findOne(id);
    
    const result = await this.familleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Famille avec l'ID ${id} non trouvée`);
    }
  }
}