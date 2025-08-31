//  src/app/core/models/log-historique.interface.ts

import { User } from './user.interface';

export interface LogHistorique {
  id: string;
  inspectionId: string;
  interventionPar: string;
  ancienEtat?: string;
  nouvelEtat?: string;
  commentaire?: string;
  dateIntervention: Date;
  
  // Relations avec vos modèles existants
  intervenant?: User;
  inspection?: {
    id: string;
    titre: string;
    statut: string;
  };
}

export interface LogHistoriqueFilter {
  interventionPar?: string;
  inspectionId?: string;
  dateDebut?: string;
  dateFin?: string;
  page?: number;
  limit?: number;
}

export interface StatistiqueEtat {
  ancien: string;
  nouveau: string;
  count: number;
}