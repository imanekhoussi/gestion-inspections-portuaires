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
export interface LogSearchParams {
  utilisateurId?: string;
  inspectionId?: string;
  dateDebut?: Date;
  dateFin?: Date;
  ancienEtat?: string[];
  nouvelEtat?: string[];
  hasCommentaire?: boolean;
  searchText?: string;
}
export const ETATS_INSPECTION = [
  'PROGRAMMEE',
  'EN_COURS', 
  'TERMINEE',
  'VALIDEE',
  'ANNULEE',
  'REPORTEE'
] as const;

export interface QuickStats {
  totalLogs: number;
  uniqueUsers: number;
  uniqueInspections: number;
  actionsToday: number;
  actionsThisWeek: number;
}

export type EtatInspection = typeof ETATS_INSPECTION[number];

export interface QuickStats {
  totalLogs: number;
  uniqueUsers: number;
  uniqueInspections: number;
  actionsToday: number;
  actionsThisWeek: number;
}
export interface StatistiqueEtat {
  ancien: string;
  nouveau: string;
  count: number;
}