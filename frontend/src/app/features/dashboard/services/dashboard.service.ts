import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardKpis } from '../../../core/models/dashboard.interface';

// Interfaces for backend data
export interface StatsFamilleRaw {
  famille: string;
  etat: string;
  nombre: string;
}

export interface EvolutionIndicesRaw {
  indice: number;
  nombre: string;
}

export interface ActifsGeoJson {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: {
      id: number;
      nom: string;
      code: string;
      site: string;
      zone: string;
      ouvrage: string;
      indiceEtat: number;
      famille: string;
      groupe: string;
    };
    geometry: {
      type: string;
      coordinates: number[];
    };
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getKpis(): Observable<DashboardKpis> {
    return this.http.get<DashboardKpis>(`${this.API_URL}/dashboard/kpis`);
  }

  getStatsFamille(): Observable<StatsFamilleRaw[]> {
    return this.http.get<StatsFamilleRaw[]>(`${this.API_URL}/dashboard/stats-famille`);
  }

  getEvolutionIndices(): Observable<EvolutionIndicesRaw[]> {
    return this.http.get<EvolutionIndicesRaw[]>(`${this.API_URL}/dashboard/evolution-indices`);
  }

  getActifsGeoJson(): Observable<ActifsGeoJson> {
    return this.http.get<ActifsGeoJson>(`${this.API_URL}/dashboard/actifs-geojson`);
  }
}