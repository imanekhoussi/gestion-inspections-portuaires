// Enhanced interfaces to support grouping by families and groups
export interface ActifFamille {
  id: number;
  nom: string;
  description?: string;
  couleur?: string; // For visual grouping
}

export interface ActifGroupe {
  id: number;
  nom: string;
  description?: string;
  idFamille: number;
  famille?: ActifFamille;
  couleur?: string; // For visual grouping
}

export interface Actif {
  id: number;
  nom: string;
  code: string;
  description?: string;
  site: string;
  zone: string;
  ouvrage: string;
  indiceEtat: number;
  dateCreation: Date;
  dateDerniereMaintenance?: Date;
  idGroupe: number;
  groupe?: ActifGroupe;
  geometry?: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: number[] | number[][] | number[][][];
  };
  // Additional properties for enhanced filtering
  tags?: string[];
  criticite?: 'FAIBLE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE';
  statut?: 'ACTIF' | 'MAINTENANCE' | 'HORS_SERVICE';
}

export interface CreateActifDto {
  nom: string;
  code: string;
  site: string;
  zone: string;
  ouvrage: string;
  idGroupe: number;
  indiceEtat?: number;
  geometryType?: 'Point' | 'LineString' | 'Polygon';
  coordinates?: any[];
}

export interface ActifGeoJSON {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: {
      type: 'Point' | 'LineString' | 'Polygon';
      coordinates: number[] | number[][] | number[][][];
    };
    properties: {
      id: number;
      nom: string;
      site: string;
      zone: string;
      indiceEtat: number;
      description?: string;
      groupeNom?: string;
      familleNom?: string;
      couleurGroupe?: string;
      couleurFamille?: string;
      criticite?: string;
      statut?: string;
      tags?: string[];
    };
  }>;
}

// Filter interfaces for advanced filtering
export interface FilterCriteria {
  sites?: string[];
  zones?: string[];
  familles?: number[];
  groupes?: number[];
  etats?: number[];
  criticites?: string[];
  statuts?: string[];
  tags?: string[];
  dateDebut?: Date;
  dateFin?: Date;
}

export interface StatistiquesActifs {
  totalActifs: number;
  parEtat: Record<number, number>;
  parSite: Record<string, number>;
  parZone: Record<string, number>;
  parFamille: Record<string, number>;
  parGroupe: Record<string, number>;
  parCriticite: Record<string, number>;
  moyenneIndiceEtat: number;
}