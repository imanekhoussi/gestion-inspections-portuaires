// src/app/features/admin/services/admin.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';

// Utilisation directe de l'URL API au lieu d'environment
const API_URL = 'http://localhost:3000';

import {
  // Entités
  Utilisateur, Famille, Groupe, TypeInspection, Inspection, Actif,
  // DTOs
  CreateUtilisateurDto, UpdateUtilisateurDto,
  CreateFamilleDto, UpdateFamilleDto,
  CreateGroupeDto, UpdateGroupeDto,
  CreateTypeInspectionDto, UpdateTypeInspectionDto,
  CreateInspectionDto, UpdateInspectionDto, UpdateEtatInspectionDto,
  CreateActifDto, UpdateActifDto,
  // Autres types
  ArborescenceResponse, StatistiquesAdmin, PaginatedResponse,
  FiltresUtilisateurs, FiltresGroupes, FiltresTypesInspection,
  FiltresInspections, FiltresActifs, FiltresArborescence,
  ApiResponse
} from '../../../core/models/admin.interfaces';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = `${API_URL}/admin`;

  // Subjects pour la mise à jour en temps réel
  private utilisateursSubject = new BehaviorSubject<Utilisateur[]>([]);
  private famillesSubject = new BehaviorSubject<Famille[]>([]);
  private groupesSubject = new BehaviorSubject<Groupe[]>([]);
  private typesInspectionSubject = new BehaviorSubject<TypeInspection[]>([]);
  private inspectionsSubject = new BehaviorSubject<Inspection[]>([]);
  private actifsSubject = new BehaviorSubject<Actif[]>([]);

  // Observables publics
  public utilisateurs$ = this.utilisateursSubject.asObservable();
  public familles$ = this.famillesSubject.asObservable();
  public groupes$ = this.groupesSubject.asObservable();
  public typesInspection$ = this.typesInspectionSubject.asObservable();
  public inspections$ = this.inspectionsSubject.asObservable();
  public actifs$ = this.actifsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ===== UTILISATEURS =====
  getUtilisateurs(filtres?: FiltresUtilisateurs): Observable<Utilisateur[]> {
    let params = new HttpParams();
    if (filtres) {
      Object.keys(filtres).forEach(key => {
        const value = (filtres as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }


    return this.http.get<Utilisateur[]>(`${this.apiUrl}/utilisateurs`, { params })
      .pipe(
        tap(users => this.utilisateursSubject.next(users))
      );
  }

  createUtilisateur(data: CreateUtilisateurDto): Observable<Utilisateur> {
    return this.http.post<ApiResponse<Utilisateur>>(`${this.apiUrl}/utilisateurs`, data)
      .pipe(
        map(response => response.data!),
        tap(() => this.refreshUtilisateurs())
      );
  }


  updateUtilisateur(id: string, data: UpdateUtilisateurDto): Observable<Utilisateur> {
    return this.http.patch<Utilisateur>(`${this.apiUrl}/utilisateurs/${id}`, data)
      .pipe(
        tap(() => this.refreshUtilisateurs())
      );
  }

  deleteUtilisateur(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/utilisateurs/${id}`)
      .pipe(
        map(() => void 0),
        tap(() => this.refreshUtilisateurs())
      );
  }

  private refreshUtilisateurs(): void {
    this.getUtilisateurs().subscribe();
  }

  // ===== FAMILLES =====

  getFamilles(): Observable<Famille[]> {
    return this.http.get<Famille[]>(`${this.apiUrl}/familles`)
      .pipe(
        tap(familles => this.famillesSubject.next(familles))
      );
  }

  createFamille(data: CreateFamilleDto): Observable<Famille> {
    return this.http.post<ApiResponse<Famille>>(`${this.apiUrl}/familles`, data)
      .pipe(
        map(response => response.data!),
        tap(() => this.refreshFamilles())
      );
  }

  updateFamille(id: string, data: UpdateFamilleDto): Observable<Famille> {

    return this.http.patch<ApiResponse<Famille>>(`${this.apiUrl}/familles/${id}`, data)
    .pipe(
      map(response => response.data!),
      tap(() => this.refreshFamilles())
    );
}

  deleteFamille(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/familles/${id}`)
      .pipe(
        map(() => void 0),
        tap(() => this.refreshFamilles())
      );
  }

  private refreshFamilles(): void {
    this.getFamilles().subscribe();
  }

  // ===== GROUPES =====
  getGroupes(filtres?: FiltresGroupes): Observable<Groupe[]> {
    let params = new HttpParams();
    if (filtres) {
      Object.keys(filtres).forEach(key => {
        const value = (filtres as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<Groupe[]>(`${this.apiUrl}/groupes`, { params })
    .pipe(
      tap(groupes => this.groupesSubject.next(groupes))
    );
  }

  createGroupe(data: CreateGroupeDto): Observable<Groupe> {
    return this.http.post<ApiResponse<Groupe>>(`${this.apiUrl}/groupes`, data)
      .pipe(
        map(response => response.data!),
        tap(() => this.refreshGroupes())
      );
  }

  updateGroupe(id: string, data: UpdateGroupeDto): Observable<Groupe> {
   return this.http.patch<ApiResponse<Groupe>>(`${this.apiUrl}/groupes/${id}`, data)
    .pipe(
      map(response => response.data!),
      tap(() => this.refreshGroupes())
    );
}

  deleteGroupe(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/groupes/${id}`)
      .pipe(
        map(() => void 0),
        tap(() => this.refreshGroupes())
      );
  }

  private refreshGroupes(): void {
    this.getGroupes().subscribe();
  }

  // ===== TYPES D'INSPECTION =====
  getTypesInspection(): Observable<TypeInspection[]> {
    return this.http.get<TypeInspection[]>(`${this.apiUrl}/types-inspection`)
      .pipe(
        tap(types => this.typesInspectionSubject.next(types))
      );
  }


  /**
   * Sends data to the API to create a new inspection type.
   */
  createTypeInspection(data: CreateTypeInspectionDto): Observable<TypeInspection> {
    return this.http.post<TypeInspection>(`${this.apiUrl}/types-inspection`, data)
      .pipe(
        tap(() => this.refreshTypesInspection())
      );
  }

  /**
   * Sends data to the API to update an existing inspection type.
   * We use PATCH here to match the backend controller.
   */
  updateTypeInspection(id: number, data: UpdateTypeInspectionDto): Observable<TypeInspection> {
    return this.http.patch<TypeInspection>(`${this.apiUrl}/types-inspection/${id}`, data)
      .pipe(
        tap(() => this.refreshTypesInspection())
      );
  }

  /**
   * Sends a request to the API to delete an inspection type.
   */
  deleteTypeInspection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/types-inspection/${id}`)
      .pipe(
        tap(() => this.refreshTypesInspection())
      );
  }
/**
   * A private helper method to refresh the list of inspection types after a change.
   */
  private refreshTypesInspection(): void {
    this.getTypesInspection().subscribe();
  }

  // ===== INSPECTIONS =====
  

  getInspections(filtres?: FiltresInspections): Observable<PaginatedResponse<Inspection>> {
  const params = this.buildParams(filtres);

  return this.http.get<PaginatedResponse<Inspection>>(`${this.apiUrl}/inspections`, { params })
    .pipe(
      tap(response => this.inspectionsSubject.next(response.data))
    );
}

  createInspection(data: CreateInspectionDto): Observable<Inspection> {
    return this.http.post<ApiResponse<Inspection>>(`${this.apiUrl}/inspections`, data)
      .pipe(
        map(response => response.data!),
        tap(() => this.refreshInspections())
      );
  }

  updateInspection(id: string, data: UpdateInspectionDto): Observable<Inspection> {
    return this.http.put<ApiResponse<Inspection>>(`${this.apiUrl}/inspections/${id}`, data)
      .pipe(
        map(response => response.data!),
        tap(() => this.refreshInspections())
      );
  }

  updateEtatInspection(id: string, data: UpdateEtatInspectionDto): Observable<Inspection> {
    return this.http.patch<ApiResponse<Inspection>>(`${this.apiUrl}/inspections/${id}/etat`, data)
      .pipe(
        map(response => response.data!),
        tap(() => this.refreshInspections())
      );
  }

  deleteInspection(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/inspections/${id}`)
      .pipe(
        map(() => void 0),
        tap(() => this.refreshInspections())
      );
  }

  private refreshInspections(): void {
    this.getInspections().subscribe();
  }

  // ===== ACTIFS =====
  getActifs(filtres?: FiltresActifs): Observable<PaginatedResponse<Actif>> {
    let params = new HttpParams();
    if (filtres) {
      Object.keys(filtres).forEach(key => {
        const value = (filtres as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    // MODIFICATION: Utilisation de API_URL au lieu de this.apiUrl pour retirer le préfixe /admin
    return this.http.get<PaginatedResponse<Actif>>(`${API_URL}/actifs`, { params })
      .pipe(
        tap(response => this.actifsSubject.next(response.data))
      );
  }

  createActif(data: CreateActifDto): Observable<Actif> {
    // MODIFICATION: Utilisation de API_URL au lieu de this.apiUrl
    return this.http.post<ApiResponse<Actif>>(`${API_URL}/actifs`, data)
      .pipe(
        map(response => response.data!),
        tap(() => this.refreshActifs())
      );
  }

  updateActif(id: string, data: UpdateActifDto): Observable<Actif> {
    // MODIFICATION: Utilisation de API_URL au lieu de this.apiUrl
    return this.http.put<ApiResponse<Actif>>(`${API_URL}/actifs/${id}`, data)
      .pipe(
        map(response => response.data!),
        tap(() => this.refreshActifs())
      );
  }

  deleteActif(id: string): Observable<void> {
    // MODIFICATION: Utilisation de API_URL au lieu de this.apiUrl
    return this.http.delete<ApiResponse<void>>(`${API_URL}/actifs/${id}`)
      .pipe(
        map(() => void 0),
        tap(() => this.refreshActifs())
      );
  }

  private refreshActifs(): void {
    this.getActifs().subscribe();
  }

  // ===== ARBORESCENCE =====
  getArborescence(filtres?: FiltresArborescence): Observable<ArborescenceResponse> {
    let params = new HttpParams();
    if (filtres) {
      Object.keys(filtres).forEach(key => {
        const value = (filtres as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<ArborescenceResponse>>(`${this.apiUrl}/arborescence`, { params })
      .pipe(
        map(response => response.data!)
      );
  }

  // ===== STATISTIQUES =====
  getStatistiques(): Observable<StatistiquesAdmin> {
    return this.http.get<ApiResponse<StatistiquesAdmin>>(`${this.apiUrl}/statistiques`)
      .pipe(
        map(response => response.data!)
      );
  }

  // ===== UTILITAIRES =====
  rechercherEntites(terme: string, types: string[] = []): Observable<any[]> {
    let params = new HttpParams()
      .set('q', terme);

    if (types.length > 0) {
      params = params.set('types', types.join(','));
    }

    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/recherche`, { params })
      .pipe(
        map(response => response.data!)
      );
  }

  exporterDonnees(type: string, filtres?: any): Observable<Blob> {
    let params = new HttpParams()
      .set('type', type);

    if (filtres) {
      Object.keys(filtres).forEach(key => {
        const value = filtres[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  // ===== VALIDATION =====
  validerCode(type: 'famille' | 'groupe' | 'actif', code: string, excludeId?: string): Observable<boolean> {
    let params = new HttpParams()
      .set('type', type)
      .set('code', code);

    if (excludeId) {
      params = params.set('excludeId', excludeId);
    }

    return this.http.get<ApiResponse<{ disponible: boolean }>>(`${this.apiUrl}/valider-code`, { params })
      .pipe(
        map(response => response.data!.disponible)
      );
  }

  // ===== MÉTHODES DE RAFRAÎCHISSEMENT =====
  refreshAll(): void {
    this.refreshUtilisateurs();
    this.refreshFamilles();
    this.refreshGroupes();
    this.refreshTypesInspection();
    this.refreshInspections();
    this.refreshActifs();
  }

  // ===== GESTION DES ERREURS =====
  private handleError(error: any): Observable<never> {
    console.error('Erreur AdminService:', error);
    throw error;
  }
  private buildParams(filters: any): HttpParams {
    let params = new HttpParams();
    if (filters) {
      for (const key in filters) {
        if (Object.prototype.hasOwnProperty.call(filters, key)) {
          const value = filters[key];
          if (value !== null && value !== undefined && value !== '') {
            if (value instanceof Date) {
              params = params.set(key, value.toISOString());
            } else {
              params = params.set(key, value.toString());
            }
          }
        }
      }
    }
    return params;
  }
}