// src/app/core/models/admin.interfaces.ts

// ===== TYPES DE BASE (UNE SEULE FOIS) =====
export type EtatActif = 
  | 'Actif'
  | 'Maintenance'
  | 'Arrêt'
  | 'Hors service';

export enum EtatInspection {
  PROGRAMMEE = 'PROGRAMMEE',
  EN_COURS = 'EN_COURS', 
  CLOTUREE = 'CLOTUREE',
  VALIDEE = 'VALIDEE',
  REJETEE = 'REJETEE',
  ANNULEE = 'ANNULEE'
}

export type FrequenceInspection = 
  | 'Quotidienne'
  | 'Hebdomadaire' 
  | 'Mensuelle'
  | 'Trimestrielle'
  | 'Semestrielle'
  | 'Annuelle';

export type RoleUtilisateur = 
  | 'admin'
  | 'inspecteur'
  | 'consultant';

// ===== INTERFACES DE BASE =====
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== FAMILLE =====
export interface Famille extends BaseEntity {
  nom: string;
  code: string;
  description?: string;
  groupes?: Groupe[];
}

export interface CreateFamilleDto {
  nom: string;
  code: string;
  description?: string;
}

export interface UpdateFamilleDto extends Partial<CreateFamilleDto> {}

// ===== GROUPE =====
export interface Groupe extends BaseEntity {
  nom: string;
  code: string;
  idFamille: string;
  description?: string;
  famille?: Famille;
  actifs?: Actif[];
  typesInspection?: TypeInspection[];
}

export interface CreateGroupeDto {
  nom: string;
  code: string;
  idFamille: string;
  description?: string;
}

export interface UpdateGroupeDto extends Partial<CreateGroupeDto> {}

// ===== TYPE D'INSPECTION =====
export interface TypeInspection extends BaseEntity {
  nom: string;
  frequence: FrequenceInspection;
  idGroupe: string;
  description?: string;
  groupe?: Groupe;
  inspections?: Inspection[];
}

export interface CreateTypeInspectionDto {
  nom: string;
  frequence: FrequenceInspection;
  idGroupe: string;
  description?: string;
}

export interface UpdateTypeInspectionDto extends Partial<CreateTypeInspectionDto> {}

// ===== ACTIF =====
export interface Actif extends BaseEntity {
  nom: string;
  code: string;
  idGroupe: string;
  site: string;
  etat: EtatActif;
  description?: string;
  localisation?: string;
  groupe?: Groupe;
  inspections?: Inspection[];
}

export interface CreateActifDto {
  nom: string;
  code: string;
  idGroupe: string;
  site: string;
  etat: EtatActif;
  description?: string;
  localisation?: string;
}

export interface UpdateActifDto extends Partial<CreateActifDto> {}

// ===== UTILISATEUR =====
export interface Utilisateur extends BaseEntity {
  nom: string;
  email: string;
  role: RoleUtilisateur;
  telephone?: string;
  actif: boolean;
  derniereConnexion?: Date;
  inspections?: Inspection[];
}

export interface CreateUtilisateurDto {
  nom: string;
  email: string;
  password: string;
  role: RoleUtilisateur;
  telephone?: string;
}

export interface UpdateUtilisateurDto extends Partial<Omit<CreateUtilisateurDto, 'password'>> {
  password?: string;
}

// ===== INSPECTION =====
export interface Inspection extends BaseEntity {
  titre: string;
  idType: string;
  dateDebut: Date;
  dateFin: Date;
  etat: EtatInspection;
  commentaire?: string;
  actifIds: string[]; // This might be unused if 'actifs' is always present
  idInspecteur?: string;

  // ✅ FIX: Renamed properties to match backend relations
  typeInspection?: TypeInspection; // Was 'type'
  createur?: Utilisateur;         // Was 'inspecteur'

  // This one was correct
  actifs?: Actif[];
  resultats?: ResultatInspection[];
}

export interface CreateInspectionDto {
  titre: string;
  idType: string;
  dateDebut: Date;
  dateFin: Date;
  actifIds: string[];
  idInspecteur?: string;
  commentaire?: string;
}

export interface UpdateInspectionDto extends Partial<CreateInspectionDto> {}

export interface UpdateEtatInspectionDto {
  etat: EtatInspection;
  commentaire?: string;
}

// ===== RÉSULTAT D'INSPECTION =====
export interface ResultatInspection extends BaseEntity {
  idInspection: string;
  idActif: string;
  conforme: boolean;
  commentaire?: string;
  photos?: string[];
  inspection?: Inspection;
  actif?: Actif;
}

export interface CreateResultatInspectionDto {
  idInspection: string;
  idActif: string;
  conforme: boolean;
  commentaire?: string;
  photos?: string[];
}

// ===== ARBORESCENCE =====
export interface ArborescenceNode {
  id: string;
  nom: string;
  code: string;
  type: 'famille' | 'groupe' | 'actif';
  enfants?: ArborescenceNode[];
  metadata?: {
    nbGroupes?: number;
    nbActifs?: number;
    site?: string;
    etat?: EtatActif;
  };
}

export interface ArborescenceResponse {
  familles: ArborescenceNode[];
  totalFamilles: number;
  totalGroupes: number;
  totalActifs: number;
}

// ===== FILTRES =====
export interface FiltresBase {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface FiltresUtilisateurs extends FiltresBase {
  role?: RoleUtilisateur;
  actif?: boolean;
}

export interface FiltresGroupes extends FiltresBase {
  idFamille?: string;
}

export interface FiltresTypesInspection extends FiltresBase {
  idGroupe?: string;
  frequence?: FrequenceInspection;
}

export interface FiltresInspections extends FiltresBase {
  idType?: string;
  etat?: EtatInspection;
  dateDebut?: Date;
  dateFin?: Date;
  site?: string;
}

export interface FiltresActifs extends FiltresBase {
  idGroupe?: string;
  site?: string;
  etat?: EtatActif;
}

export interface FiltresArborescence {
  site?: string;
  etatActif?: EtatActif;
  expandAll?: boolean;
}

// ===== RÉPONSES API =====
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// ===== STATISTIQUES =====
export interface StatistiquesAdmin {
  utilisateurs: {
    total: number;
    actifs: number;
    parRole: Record<RoleUtilisateur, number>;
  };
  familles: {
    total: number;
  };
  groupes: {
    total: number;
    parFamille: Array<{
      familleNom: string;
      count: number;
    }>;
  };
  typesInspection: {
    total: number;
    parFrequence: Record<FrequenceInspection, number>;
  };
  inspections: {
    total: number;
    parEtat: Record<EtatInspection, number>;
    enRetard: number;
    termineesCeMois: number;
  };
  actifs: {
    total: number;
    parEtat: Record<EtatActif, number>;
    parSite: Array<{
      site: string;
      count: number;
    }>;
  };
}

// ===== NOTIFICATIONS =====
export interface NotificationAdmin {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  titre: string;
  message: string;
  timestamp: Date;
  lu: boolean;
  action?: {
    libelle: string;
    route: string;
    params?: any;
  };
}