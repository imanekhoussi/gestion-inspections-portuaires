
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

  
  async findAll(): Promise<Famille[]> {
    return this.familleRepository
      .createQueryBuilder('famille')
      .leftJoin('famille.groupes', 'groupe')
      .leftJoin('groupe.actifs', 'actif')
      .loadRelationCountAndMap('famille.nbGroupes', 'famille.groupes')
      .loadRelationCountAndMap('famille.nbActifs', 'famille.groupes.actifs')
      .getMany();
  }

  
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

  
  async findAllWithDetailedCounts(): Promise<any[]> {
    return this.familleRepository
      .createQueryBuilder('famille')
      .leftJoin('famille.groupes', 'groupe')
      .leftJoin('groupe.actifs', 'actif')
      .select([
        'famille.id',
        'famille.nom',
        'famille.code',
        'famille.description',
        'famille.createdAt',
        'famille.updatedAt'
      ])
      .addSelect('COUNT(DISTINCT groupe.id)', 'nbGroupes')
      .addSelect('COUNT(DISTINCT actif.id)', 'nbActifs')
      .groupBy('famille.id')
      .addGroupBy('famille.nom')
      .addGroupBy('famille.code')
      .addGroupBy('famille.description')
      .addGroupBy('famille.createdAt')
      .addGroupBy('famille.updatedAt')
      .getRawAndEntities();
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