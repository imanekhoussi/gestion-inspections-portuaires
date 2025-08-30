
export interface Inspection {
  id: number;
  titre: string;
  idType: number;
  dateDebut: Date;
  dateFin: Date;
  etat: EtatInspection;
  createdBy?: number;
  createdAt: Date;
  deletedBy?: number;
  deletedAt?: Date;
  rejectedBy?: number;
  rejectedAt?: Date;
  motifRejet?: string;
  cloturedBy?: number;
  cloturedAt?: Date;
  commentaireCloture?: string;
  validatedBy?: number;
  validatedAt?: Date;
  commentaireValidation?: string;
  
  // Relations
  typeInspection?: TypeInspection;
  actifs?: Actif[];
  createur?: Utilisateur;
  validateur?: Utilisateur;
  rejeteur?: Utilisateur;
  livrables?: Livrable[];
}

export enum EtatInspection {
  PROGRAMMEE = 'programmee',
  EN_COURS = 'en_cours',
  CLOTUREE = 'cloturee',
  VALIDEE = 'validee',
  REJETEE = 'rejetee'
}

export interface TypeInspection {
  id: number;
  nom: string;
}

export interface Actif {
  id: number;
  nom: string;
  site?: string;
  zone?: string;
  indiceEtat?: number;
  geometry?: {
    coordinates: [number, number];
  };
}

export interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  role: RoleUtilisateur;
  telephone?: string;
  photoProfil?: string;
}

export enum RoleUtilisateur {
  OPERATEUR = 'operateur',
  MAITRE_OUVRAGE = 'maitre_ouvrage',
  ADMIN = 'admin'
}

export interface Livrable {
  id: number;
  idInspection: number;
  originalName: string;
  currentName: string;
  taille: number;
  insertBy: number;
  insertAt: Date;
  inserteur?: Utilisateur;
}

export interface LogHistorique {
  id: number;
  inspectionId: number;
  ancienEtat?: string;
  nouvelEtat?: string;
  interventionPar: number;
  dateIntervention: Date;
  commentaire?: string;
  intervenant?: Utilisateur;
}

// DTOs for API calls
export interface CloturerInspectionDto {
  commentaire?: string;
  actifsUpdates?: ActifConditionUpdateDto[];
}

export interface ActifConditionUpdateDto {
  actifId: number;
  nouvelIndiceEtat: number;
  commentaire?: string;
}

export interface ValiderInspectionDto {
  commentaire?: string;
}

export interface RejeterInspectionDto {
  motifRejet: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface CalendarInspection {
  id: string;
  title: string;
  start: string;
  end: string;
  status: 'Planifiée' | 'Terminée' | 'Annulée' | 'Rejetée';
}