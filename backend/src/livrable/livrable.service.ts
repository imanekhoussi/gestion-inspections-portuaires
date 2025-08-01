// src/livrable/livrable.service.ts - VÉRIFIER QUE VOUS AVEZ BIEN CE CODE

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Livrable } from '../entities/livrable.entity';
import { CreateLivrableDto, UpdateLivrableDto } from './dto/livrable.dto';
import { LogHistoriqueService } from '../log-historique/log-historique.service';
import { TypeAction, TypeEntite } from '../entities/log-historique.entity';

@Injectable()
export class LivrableService {
  constructor(
    @InjectRepository(Livrable)
    private livrableRepository: Repository<Livrable>,
    private logService: LogHistoriqueService,
  ) {}

  async create(createLivrableDto: CreateLivrableDto, insertBy: number): Promise<Livrable> {
    const livrable = this.livrableRepository.create({
      ...createLivrableDto,
      insertBy
    });
    const savedLivrable = await this.livrableRepository.save(livrable);

    // Log de création
    await this.logService.enregistrerLog(
      TypeAction.CREATION,
      TypeEntite.LIVRABLE,
      savedLivrable.id,
      insertBy,
      null,
      { originalName: savedLivrable.originalName, taille: savedLivrable.taille },
      `Ajout du livrable ${savedLivrable.originalName}`
    );

    return savedLivrable;
  }

  async findAll(): Promise<Livrable[]> {
    return await this.livrableRepository.find({
      relations: ['inspection', 'inserteur']
    });
  }

  async findOne(id: number): Promise<Livrable> {
    const livrable = await this.livrableRepository.findOne({
      where: { id },
      relations: ['inspection', 'inserteur']
    });
    
    if (!livrable) {
      throw new NotFoundException(`Livrable avec l'ID ${id} non trouvé`);
    }
    
    return livrable;
  }

  async findByInspection(idInspection: number): Promise<Livrable[]> {
    return await this.livrableRepository.find({
      where: { idInspection },
      relations: ['inserteur']
    });
  }

  async update(id: number, updateLivrableDto: UpdateLivrableDto, updatedBy: number): Promise<Livrable> {
    const livrable = await this.findOne(id);
    const ancienEtat = { originalName: livrable.originalName, currentName: livrable.currentName };
    
    Object.assign(livrable, updateLivrableDto);
    const updatedLivrable = await this.livrableRepository.save(livrable);

    // Log de modification
    await this.logService.enregistrerLog(
      TypeAction.MODIFICATION,
      TypeEntite.LIVRABLE,
      id,
      updatedBy,
      ancienEtat,
      { originalName: updatedLivrable.originalName, currentName: updatedLivrable.currentName },
      `Modification du livrable ${updatedLivrable.originalName}`
    );

    return updatedLivrable;
  }

  async remove(id: number, deletedBy: number): Promise<void> {
    const livrable = await this.findOne(id);
    
    // Log de suppression
    await this.logService.enregistrerLog(
      TypeAction.SUPPRESSION,
      TypeEntite.LIVRABLE,
      id,
      deletedBy,
      { originalName: livrable.originalName, taille: livrable.taille },
      null,
      `Suppression du livrable ${livrable.originalName}`
    );

    await this.livrableRepository.remove(livrable);
  }
}
