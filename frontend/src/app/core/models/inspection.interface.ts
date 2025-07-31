export interface Inspection {
  id: string;
  titre: string;
  description?: string;
  actifId: string;
  actifNom?: string;
  inspecteurId: string;
  inspecteurNom?: string;
  dateCreation: Date;
  datePrevue: Date;
  dateRealisation?: Date;
  statut: InspectionStatut;
  priorite: InspectionPriorite;
  conformite?: boolean;
  observations?: string;
  photos?: string[];
}

export enum InspectionStatut {
  PROGRAMMEE = 'PROGRAMMEE',
  EN_COURS = 'EN_COURS',
  TERMINEE = 'TERMINEE',
  VALIDEE = 'VALIDEE',
  ANNULEE = 'ANNULEE'
}

export enum InspectionPriorite {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  CRITIQUE = 'CRITIQUE'
}