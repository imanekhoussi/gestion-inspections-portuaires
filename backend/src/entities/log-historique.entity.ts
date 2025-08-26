// src/entities/log-historique.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Utilisateur } from './utilisateur.entity';
import { Inspection } from './inspection.entity';

@Entity('log_historique')
export class LogHistorique {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'inspection_id', type: 'integer' })
  inspectionId: number;

  @Column({ name: 'ancien_etat', type: 'varchar', length: 50, nullable: true })
  ancienEtat: string | null;

  @Column({ name: 'nouveau_etat', type: 'varchar', length: 50, nullable: true })
  nouvelEtat: string | null;

  @Column({ name: 'intervention_par', type: 'integer' })
  interventionPar: number;

  @Column({ name: 'date_intervention', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dateIntervention: Date;

  @Column({ type: 'text', nullable: true })
  commentaire: string | null;

  @ManyToOne(() => Utilisateur)
  @JoinColumn({ name: 'intervention_par' })
  intervenant: Utilisateur;

  @ManyToOne(() => Inspection)
  @JoinColumn({ name: 'inspection_id' })
  inspection: Inspection;
}