import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Famille {
  id: number;
  nom: string;
  code: string;
  createdAt?: Date;
  updatedAt?: Date;
  nombreGroupes?: number;
  nombreActifs?: number;
}

export interface Groupe {
  id: number;
  nom: string;
  code: string;
  idFamille: number;
  createdAt?: Date;
  updatedAt?: Date;
  famille?: Famille;
  nombreActifs?: number;
}

export interface Actif {
  id: number;
  site: string;
  zone: string;
  ouvrage: string;
  nom: string;
  code: string;
  idGroupe: number;
  indiceEtat?: number;
  latitude?: number;
  longitude?: number;
  createdAt?: Date;
  updatedAt?: Date;
  groupe?: Groupe;
}

@Injectable({
  providedIn: 'root'
})
export class FamillesService {
  private readonly apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // === VERSION SIMPLE AVEC STATISTIQUES ===
  getFamilles(): Observable<Famille[]> {
    // 1. Récupérer familles et groupes en parallèle
    return forkJoin({
      familles: this.http.get<Famille[]>(`${this.apiUrl}/admin/familles`),
      groupes: this.http.get<Groupe[]>(`${this.apiUrl}/admin/groupes`)
    }).pipe(
      map(({ familles, groupes }) => {
        // 2. Ajouter les statistiques à chaque famille
        return familles.map(famille => {
          const groupesDeLaFamille = groupes.filter(g => g.idFamille === famille.id);
          return {
            ...famille,
            nombreGroupes: groupesDeLaFamille.length,
            nombreActifs: 0 // On mettra les actifs plus tard
          };
        });
      })
    );
  }

  getFamilleById(id: number): Observable<Famille> {
    return this.http.get<Famille>(`${this.apiUrl}/admin/familles/${id}`);
  }

  getAllGroupes(): Observable<Groupe[]> {
    return this.http.get<Groupe[]>(`${this.apiUrl}/admin/groupes`);
  }

  getGroupesByFamille(familleId: number): Observable<Groupe[]> {
    return this.http.get<Groupe[]>(`${this.apiUrl}/admin/groupes`).pipe(
      map(groupes => groupes.filter(g => g.idFamille === familleId))
    );
  }

  getGroupeById(id: number): Observable<Groupe> {
    return this.http.get<Groupe>(`${this.apiUrl}/admin/groupes/${id}`);
  }

  getAllActifs(): Observable<Actif[]> {
    return this.http.get<Actif[]>(`${this.apiUrl}/actifs`);
  }

  getActifsByGroupe(groupeId: number): Observable<Actif[]> {
    return this.http.get<Actif[]>(`${this.apiUrl}/actifs/by-groupe/${groupeId}`);
  }

  getActifById(id: number): Observable<Actif> {
    return this.http.get<Actif>(`${this.apiUrl}/actifs/${id}`);
  }

  getActifsMapData(): Observable<Actif[]> {
    return this.http.get<Actif[]>(`${this.apiUrl}/actifs/map-data`);
  }
}