// src/entities/log-historique.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Utilisateur } from './utilisateur.entity';

export enum TypeAction {
  CREATION = 'creation',
  MODIFICATION = 'modification',
  SUPPRESSION = 'suppression',
  VALIDATION = 'validation',
  REJET = 'rejet',
  CLOTURE = 'cloture',
  CHANGEMENT_ETAT = 'changement_etat'
}

export enum TypeEntite {
  UTILISATEUR = 'utilisateur',
  FAMILLE = 'famille',
  GROUPE = 'groupe',
  ACTIF = 'actif',
  TYPE_INSPECTION = 'type_inspection',
  INSPECTION = 'inspection',
  LIVRABLE = 'livrable'
}

@Entity('log_historique')
export class LogHistorique {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: TypeAction })
  typeAction: TypeAction;

  @Column({ type: 'enum', enum: TypeEntite })
  typeEntite: TypeEntite;

  @Column({ name: 'entite_id', type: 'integer' })
  entiteId: number;

  @Column({ name: 'ancien_etat', type: 'text', nullable: true })
  ancienEtat: string | null;

  @Column({ name: 'nouveau_etat', type: 'text', nullable: true })
  nouvelEtat: string | null;

  @Column({ name: 'intervention_par' })
  interventionPar: number;

  @Column({ name: 'date_intervention', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dateIntervention: Date;

  @Column({ type: 'text', nullable: true })
  commentaire: string | null;

  @Column({ name: 'details_supplementaires', type: 'json', nullable: true })
  detailsSupplementaires: any;

  @ManyToOne(() => Utilisateur)
  @JoinColumn({ name: 'intervention_par' })
  intervenant: Utilisateur;
}