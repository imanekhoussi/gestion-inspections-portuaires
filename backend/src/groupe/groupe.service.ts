// src/groupe/groupe.service.ts 
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGroupeDto, UpdateGroupeDto } from './dto/groupe.dto';
import { Groupe } from '../entities/groupe.entity';
import { LogHistoriqueService } from '../log-historique/log-historique.service';
import { TypeAction, TypeEntite } from '../entities/log-historique.entity';

@Injectable()
export class GroupeService {
  constructor(
    @InjectRepository(Groupe)
    private groupeRepository: Repository<Groupe>,
    private logService: LogHistoriqueService,
  ) {}

  async create(createGroupeDto: CreateGroupeDto, createdBy: number): Promise<Groupe> {
    const groupe = this.groupeRepository.create(createGroupeDto);
    const savedGroupe = await this.groupeRepository.save(groupe);

    await this.logService.enregistrerLog(
      TypeAction.CREATION,
      TypeEntite.GROUPE,
      savedGroupe.id,
      createdBy,
      null,
      { nom: savedGroupe.nom, code: savedGroupe.code, idFamille: savedGroupe.idFamille },
      `Création du groupe ${savedGroupe.nom}`
    );

    return savedGroupe;
  }

  /**
   * Fetches all groups and adds the count of associated assets to each.
   */
  async findAll(): Promise<Groupe[]> {
    return this.groupeRepository
      .createQueryBuilder('groupe')
      .leftJoinAndSelect('groupe.famille', 'famille')
      .loadRelationCountAndMap('groupe.nbActifs', 'groupe.actifs')
      .getMany();
  }

  /**
   * Fetches a single group by ID and adds the count of its assets.
   */
  async findOne(id: number): Promise<Groupe> {
    const groupe = await this.groupeRepository
      .createQueryBuilder('groupe')
      .where('groupe.id = :id', { id })
      .leftJoinAndSelect('groupe.famille', 'famille')
      .loadRelationCountAndMap('groupe.nbActifs', 'groupe.actifs')
      .getOne();
    
    if (!groupe) {
      throw new NotFoundException(`Groupe avec l'ID ${id} non trouvé`);
    }
    
    return groupe;
  }

  async update(id: number, updateGroupeDto: UpdateGroupeDto, updatedBy: number): Promise<Groupe> {
    const groupeAvant = await this.findOne(id);
    const ancienEtat = { nom: groupeAvant.nom, code: groupeAvant.code, idFamille: groupeAvant.idFamille };
    
    // We use 'update' instead of 'save' to avoid replacing relations
    await this.groupeRepository.update(id, updateGroupeDto);
    const groupeApres = await this.findOne(id);

    await this.logService.enregistrerLog(
      TypeAction.MODIFICATION,
      TypeEntite.GROUPE,
      id,
      updatedBy,
      ancienEtat,
      { nom: groupeApres.nom, code: groupeApres.code, idFamille: groupeApres.idFamille },
      `Modification du groupe ${groupeApres.nom}`
    );

    return groupeApres;
  }

  async remove(id: number, deletedBy: number): Promise<void> {
    const groupe = await this.findOne(id);
    
    await this.logService.enregistrerLog(
      TypeAction.SUPPRESSION,
      TypeEntite.GROUPE,
      id,
      deletedBy,
      { nom: groupe.nom, code: groupe.code, nbActifs: groupe.nbActifs },
      null,
      `Suppression du groupe ${groupe.nom}`
    );

    // Using delete is safer here if there are cascading constraints
    const result = await this.groupeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Groupe avec l'ID ${id} non trouvé`);
    }
  }
}