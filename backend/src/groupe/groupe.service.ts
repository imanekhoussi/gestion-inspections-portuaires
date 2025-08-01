// src/groupe/groupe.service.ts - CRÉER CE FICHIER

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

    // Log de création
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

  async findAll(): Promise<Groupe[]> {
    return await this.groupeRepository.find({
      relations: ['famille', 'actifs', 'typesInspection']
    });
  }

  async findOne(id: number): Promise<Groupe> {
    const groupe = await this.groupeRepository.findOne({
      where: { id },
      relations: ['famille', 'actifs', 'typesInspection']
    });
    
    if (!groupe) {
      throw new NotFoundException(`Groupe avec l'ID ${id} non trouvé`);
    }
    
    return groupe;
  }

  async update(id: number, updateGroupeDto: UpdateGroupeDto, updatedBy: number): Promise<Groupe> {
    const groupe = await this.findOne(id);
    const ancienEtat = { nom: groupe.nom, code: groupe.code, idFamille: groupe.idFamille };
    
    Object.assign(groupe, updateGroupeDto);
    const updatedGroupe = await this.groupeRepository.save(groupe);

    // Log de modification
    await this.logService.enregistrerLog(
      TypeAction.MODIFICATION,
      TypeEntite.GROUPE,
      id,
      updatedBy,
      ancienEtat,
      { nom: updatedGroupe.nom, code: updatedGroupe.code, idFamille: updatedGroupe.idFamille },
      `Modification du groupe ${updatedGroupe.nom}`
    );

    return updatedGroupe;
  }

  async remove(id: number, deletedBy: number): Promise<void> {
    const groupe = await this.findOne(id);
    
    // Log de suppression
    await this.logService.enregistrerLog(
      TypeAction.SUPPRESSION,
      TypeEntite.GROUPE,
      id,
      deletedBy,
      { nom: groupe.nom, code: groupe.code, nbActifs: groupe.actifs?.length || 0 },
      null,
      `Suppression du groupe ${groupe.nom}`
    );

    await this.groupeRepository.remove(groupe);
  }
}