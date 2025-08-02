// src/log-historique/log-historique.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LogHistorique, TypeAction, TypeEntite } from '../entities/log-historique.entity';
import { CreateLogHistoriqueDto, FilterLogHistoriqueDto } from './dto/log-historique.dto';

@Injectable()
export class LogHistoriqueService {
  constructor(
    @InjectRepository(LogHistorique)
    private logRepository: Repository<LogHistorique>,
  ) {}

  // Créer un log d'historique
  async create(createLogDto: CreateLogHistoriqueDto, interventionPar: number): Promise<LogHistorique> {
    const log = this.logRepository.create({
      ...createLogDto,
      interventionPar
    });
    return await this.logRepository.save(log);
  }

  // Méthode helper pour enregistrer facilement un log
  async enregistrerLog(
    typeAction: TypeAction,
    typeEntite: TypeEntite,
    entiteId: number,
    interventionPar: number,
    ancienEtat?: any,
    nouvelEtat?: any,
    commentaire?: string
  ): Promise<LogHistorique> {
    return this.create({
      typeAction,
      typeEntite,
      entiteId,
      ancienEtat: ancienEtat ? JSON.stringify(ancienEtat) : null,
      nouvelEtat: nouvelEtat ? JSON.stringify(nouvelEtat) : null,
      commentaire,
    }, interventionPar);
  }

  // Récupérer tous les logs avec filtres
  async findAll(filters?: FilterLogHistoriqueDto): Promise<LogHistorique[]> {
    const query = this.logRepository.createQueryBuilder('log')
      .leftJoinAndSelect('log.intervenant', 'intervenant')
      .orderBy('log.dateIntervention', 'DESC');

    if (filters?.typeAction) {
      query.andWhere('log.typeAction = :typeAction', { typeAction: filters.typeAction });
    }

    if (filters?.typeEntite) {
      query.andWhere('log.typeEntite = :typeEntite', { typeEntite: filters.typeEntite });
    }

    if (filters?.interventionPar) {
      query.andWhere('log.interventionPar = :interventionPar', { interventionPar: filters.interventionPar });
    }

    if (filters?.dateDebut && filters?.dateFin) {
      query.andWhere('log.dateIntervention BETWEEN :dateDebut AND :dateFin', {
        dateDebut: filters.dateDebut,
        dateFin: filters.dateFin
      });
    }

    return await query.getMany();
  }

  // Récupérer l'historique d'une entité spécifique
  async findByEntite(typeEntite: TypeEntite, entiteId: number): Promise<LogHistorique[]> {
    return await this.logRepository.find({
      where: { typeEntite, entiteId },
      relations: ['intervenant'],
      order: { dateIntervention: 'DESC' }
    });
  }

  // Récupérer les logs d'un utilisateur spécifique
  async findByUtilisateur(interventionPar: number): Promise<LogHistorique[]> {
    return await this.logRepository.find({
      where: { interventionPar },
      relations: ['intervenant'],
      order: { dateIntervention: 'DESC' }
    });
  }

  // Statistiques des actions par type
  async getStatistiquesActions(): Promise<any> {
    const stats = await this.logRepository
      .createQueryBuilder('log')
      .select('log.typeAction', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.typeAction')
      .getRawMany();

    return stats;
  }

  // Activité récente (dernières 24h par exemple)
  async getActiviteRecente(heures: number = 24): Promise<LogHistorique[]> {
    const dateDebut = new Date();
    dateDebut.setHours(dateDebut.getHours() - heures);

    return await this.logRepository.find({
      where: {
        dateIntervention: Between(dateDebut, new Date())
      },
      relations: ['intervenant'],
      order: { dateIntervention: 'DESC' },
      take: 50 // Limiter à 50 entrées récentes
    });
  }
}
