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

  // === VERSION AVEC COMPTAGE COMPLET DES ACTIFS ===
  getFamilles(): Observable<Famille[]> {
    // 1. Récupérer familles, groupes ET actifs en parallèle
    return forkJoin({
      familles: this.http.get<Famille[]>(`${this.apiUrl}/admin/familles`),
      groupes: this.http.get<Groupe[]>(`${this.apiUrl}/admin/groupes`),
      actifs: this.http.get<Actif[]>(`${this.apiUrl}/actifs`) // AJOUT DES ACTIFS
    }).pipe(
      map(({ familles, groupes, actifs }) => {
        // 2. Ajouter les statistiques à chaque famille
        return familles.map(famille => {
          const groupesDeLaFamille = groupes.filter(g => g.idFamille === famille.id);
          
          // 3. Compter les actifs de tous les groupes de cette famille
          const actifsCount = groupesDeLaFamille.reduce((total, groupe) => {
            const actifsDeGroupe = actifs.filter(a => a.idGroupe === groupe.id);
            return total + actifsDeGroupe.length;
          }, 0);

          return {
            ...famille,
            nombreGroupes: groupesDeLaFamille.length,
            nombreActifs: actifsCount // COMPTAGE RÉEL DES ACTIFS
          };
        });
      })
    );
  }

  // === ALTERNATIVE: VERSION OPTIMISÉE (si le backend supporte) ===
  getFamillesOptimized(): Observable<Famille[]> {
    // Si votre backend retourne déjà les compteurs (après modification du service NestJS)
    return this.http.get<Famille[]>(`${this.apiUrl}/admin/familles`).pipe(
      map(familles => familles.map(famille => ({
        ...famille,
        nombreGroupes: famille.nombreGroupes || 0,
        nombreActifs: famille.nombreActifs || 0
      })))
    );
  }

  getGroupesWithActifsCount(): Observable<Groupe[]> {
    return forkJoin({
      groupes: this.http.get<Groupe[]>(`${this.apiUrl}/admin/groupes`),
      actifs: this.http.get<Actif[]>(`${this.apiUrl}/actifs`)
    }).pipe(
      map(({ groupes, actifs }) => {
        return groupes.map(groupe => ({
          ...groupe,
          nombreActifs: actifs.filter(a => a.idGroupe === groupe.id).length
        }));
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
    return forkJoin({
      groupes: this.http.get<Groupe[]>(`${this.apiUrl}/admin/groupes`),
      actifs: this.http.get<Actif[]>(`${this.apiUrl}/actifs`)
    }).pipe(
      map(({ groupes, actifs }) => {
        const groupesDeLaFamille = groupes.filter(g => g.idFamille === familleId);
        return groupesDeLaFamille.map(groupe => ({
          ...groupe,
          nombreActifs: actifs.filter(a => a.idGroupe === groupe.id).length
        }));
      })
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

  // === MÉTHODES UTILITAIRES POUR DEBUG ===
  debugCountActifs(): Observable<any> {
    return forkJoin({
      familles: this.http.get<Famille[]>(`${this.apiUrl}/admin/familles`),
      groupes: this.http.get<Groupe[]>(`${this.apiUrl}/admin/groupes`),
      actifs: this.http.get<Actif[]>(`${this.apiUrl}/actifs`)
    }).pipe(
      map(({ familles, groupes, actifs }) => {
        console.log('🔍 DEBUG - Données récupérées:');
        console.log('Familles:', familles.length);
        console.log('Groupes:', groupes.length);
        console.log('Actifs:', actifs.length);
        
        familles.forEach(famille => {
          const groupesDeLaFamille = groupes.filter(g => g.idFamille === famille.id);
          const actifsCount = groupesDeLaFamille.reduce((total, groupe) => {
            const actifsDeGroupe = actifs.filter(a => a.idGroupe === groupe.id);
            console.log(`Groupe ${groupe.nom} (${groupe.id}): ${actifsDeGroupe.length} actifs`);
            return total + actifsDeGroupe.length;
          }, 0);
          console.log(`✅ Famille ${famille.nom}: ${groupesDeLaFamille.length} groupes, ${actifsCount} actifs`);
        });

        return { familles, groupes, actifs };
      })
    );
  }
}