// src/log-historique/log-historique.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LogHistorique } from '../entities/log-historique.entity';
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

  // Méthode helper pour enregistrer un changement d'état d'inspection
  async enregistrerChangementEtat(
    inspectionId: number,
    interventionPar: number,
    ancienEtat?: string,
    nouvelEtat?: string,
    commentaire?: string
  ): Promise<LogHistorique> {
    return this.create({
      inspectionId,
      ancienEtat,
      nouvelEtat,
      commentaire
    }, interventionPar);
  }

  // Récupérer tous les logs avec filtres
  async findAll(filters?: FilterLogHistoriqueDto): Promise<LogHistorique[]> {
    const query = this.logRepository.createQueryBuilder('log')
      .leftJoinAndSelect('log.intervenant', 'intervenant')
      .leftJoinAndSelect('log.inspection', 'inspection')
      .orderBy('log.date_intervention', 'DESC');

    if (filters?.interventionPar) {
      query.andWhere('log.intervention_par = :interventionPar', { interventionPar: filters.interventionPar });
    }

    if (filters?.inspectionId) {
      query.andWhere('log.inspection_id = :inspectionId', { inspectionId: filters.inspectionId });
    }

    if (filters?.dateDebut && filters?.dateFin) {
      query.andWhere('log.date_intervention BETWEEN :dateDebut AND :dateFin', {
        dateDebut: filters.dateDebut,
        dateFin: filters.dateFin
      });
    }

    return await query.getMany();
  }

  // Récupérer l'historique d'une inspection spécifique
  async findByInspection(inspectionId: number): Promise<LogHistorique[]> {
    return await this.logRepository.find({
      where: { inspectionId },
      relations: ['intervenant', 'inspection'],
      order: { dateIntervention: 'DESC' }
    });
  }

  // Récupérer les logs d'un utilisateur spécifique
  async findByUtilisateur(interventionPar: number): Promise<LogHistorique[]> {
    return await this.logRepository.find({
      where: { interventionPar },
      relations: ['intervenant', 'inspection'],
      order: { dateIntervention: 'DESC' }
    });
  }

  // Activité récente (dernières 24h par exemple)
  async getActiviteRecente(heures: number = 24): Promise<LogHistorique[]> {
    const dateDebut = new Date();
    dateDebut.setHours(dateDebut.getHours() - heures);

    return await this.logRepository.find({
      where: {
        dateIntervention: Between(dateDebut, new Date())
      },
      relations: ['intervenant', 'inspection'],
      order: { dateIntervention: 'DESC' },
      take: 50 // Limiter à 50 entrées récentes
    });
  }

  // Récupérer l'historique chronologique complet d'une inspection
  async getHistoriqueChronologique(inspectionId: number): Promise<LogHistorique[]> {
    return await this.logRepository.find({
      where: { inspectionId },
      relations: ['intervenant'],
      order: { dateIntervention: 'ASC' } // Chronologique pour suivre l'évolution
    });
  }

  // Statistiques des changements d'état
  async getStatistiquesEtats(): Promise<any> {
    const transitions = await this.logRepository
      .createQueryBuilder('log')
      .select('log.ancien_etat', 'ancien')
      .addSelect('log.nouveau_etat', 'nouveau')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.ancien_etat, log.nouveau_etat')
      .getRawMany();

    return transitions;
  }
}