export interface Actif {
  id: string;
  nom: string;
  site: string;
  zone: string;
  description?: string;
  indiceEtat: number; // 1-5
  geometry?: {
    type: string;
    coordinates: [number, number];
  };
}

export interface ActifGeoJSON {
  type: 'FeatureCollection';
  features: ActifFeature[];
}

export interface ActifFeature {
  type: 'Feature';
  id: string;
  properties: {
    nom: string;
    site: string;
    zone: string;
    indiceEtat: number;
    description?: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}