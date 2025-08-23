import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';

const API_URL = 'http://localhost:3000';

import {
  // Entities
  Utilisateur, Famille, Groupe, TypeInspection, Inspection, Actif,
  // DTOs
  CreateUtilisateurDto, UpdateUtilisateurDto,
  CreateFamilleDto, UpdateFamilleDto,
  CreateGroupeDto, UpdateGroupeDto,
  CreateTypeInspectionDto, UpdateTypeInspectionDto,
  CreateInspectionDto, UpdateInspectionDto, UpdateEtatInspectionDto,
  CreateActifDto, UpdateActifDto,
  // Other types
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
  
  // Subjects for real-time updates
  private utilisateursSubject = new BehaviorSubject<Utilisateur[]>([]);
  private famillesSubject = new BehaviorSubject<Famille[]>([]);
  private groupesSubject = new BehaviorSubject<Groupe[]>([]);
  private typesInspectionSubject = new BehaviorSubject<TypeInspection[]>([]);
  private inspectionsSubject = new BehaviorSubject<Inspection[]>([]);
  private actifsSubject = new BehaviorSubject<Actif[]>([]);

  // Public observables
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
        tap(users => this.utilisateursSubject.next(users)),
        catchError(this.handleError)
      );
  }

  createUtilisateur(data: CreateUtilisateurDto): Observable<Utilisateur> {
    return this.http.post<ApiResponse<Utilisateur>>(`${this.apiUrl}/utilisateurs`, data)
      .pipe(
        map(response => response.data!),
        tap(() => this.refreshUtilisateurs()),
        catchError(this.handleError)
      );
  }

  updateUtilisateur(id: string, data: UpdateUtilisateurDto): Observable<Utilisateur> {
    return this.http.patch<Utilisateur>(`${this.apiUrl}/utilisateurs/${id}`, data)
      .pipe(
        tap(() => this.refreshUtilisateurs()),
        catchError(this.handleError)
      );
  }

  deleteUtilisateur(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/utilisateurs/${id}`)
      .pipe(
        map(() => void 0),
        tap(() => this.refreshUtilisateurs()),
        catchError(this.handleError)
      );
  }

  private refreshUtilisateurs(): void {
    this.getUtilisateurs().subscribe();
  }

  // ===== FAMILLES =====
  getFamilles(): Observable<Famille[]> {
    return this.http.get<Famille[]>(`${this.apiUrl}/familles`)
      .pipe(
        tap(familles => this.famillesSubject.next(familles)),
        catchError(this.handleError)
      );
  }

  createFamille(data: CreateFamilleDto): Observable<Famille> {
    return this.http.post<ApiResponse<Famille>>(`${this.apiUrl}/familles`, data)
      .pipe(
        map(response => response.data!),
        tap(() => this.refreshFamilles()),
        catchError(this.handleError)
      );
  }

  updateFamille(id: string, data: UpdateFamilleDto): Observable<Famille> {
    return this.http.patch<ApiResponse<Famille>>(`${this.apiUrl}/familles/${id}`, data)
      .pipe(
        map(response => response.data!),
        tap(() => this.refreshFamilles()),
        catchError(this.handleError)
      );
  }

  deleteFamille(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/familles/${id}`)
      .pipe(
        map(() => void 0),
        tap(() => this.refreshFamilles()),
        catchError(this.handleError)
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
        tap(groupes => this.groupesSubject.next(groupes)),
        catchError(this.handleError)
      );
  }

  createGroupe(data: CreateGroupeDto): Observable<Groupe> {
    return this.http.post<ApiResponse<Groupe>>(`${this.apiUrl}/groupes`, data)
      .pipe(
        map(response => response.data!),
        tap(() => this.refreshGroupes()),
        catchError(this.handleError)
      );
  }

  updateGroupe(id: string, data: UpdateGroupeDto): Observable<Groupe> {
    return this.http.patch<ApiResponse<Groupe>>(`${this.apiUrl}/groupes/${id}`, data)
      .pipe(
        map(response => response.data!),
        tap(() => this.refreshGroupes()),
        catchError(this.handleError)
      );
  }

  deleteGroupe(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/groupes/${id}`)
      .pipe(
        map(() => void 0),
        tap(() => this.refreshGroupes()),
        catchError(this.handleError)
      );
  }

  private refreshGroupes(): void {
    this.getGroupes().subscribe();
  }

  // ===== TYPES D'INSPECTION =====
  getTypesInspection(): Observable<TypeInspection[]> {
    return this.http.get<TypeInspection[]>(`${this.apiUrl}/types-inspection`)
      .pipe(
        tap(types => this.typesInspectionSubject.next(types)),
        catchError(this.handleError)
      );
  }

  createTypeInspection(data: CreateTypeInspectionDto): Observable<TypeInspection> {
    return this.http.post<TypeInspection>(`${this.apiUrl}/types-inspection`, data)
      .pipe(
        tap(() => this.refreshTypesInspection()),
        catchError(this.handleError)
      );
  }

  updateTypeInspection(id: number, data: UpdateTypeInspectionDto): Observable<TypeInspection> {
    return this.http.patch<TypeInspection>(`${this.apiUrl}/types-inspection/${id}`, data)
      .pipe(
        tap(() => this.refreshTypesInspection()),
        catchError(this.handleError)
      );
  }

  deleteTypeInspection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/types-inspection/${id}`)
      .pipe(
        tap(() => this.refreshTypesInspection()),
        catchError(this.handleError)
      );
  }

  private refreshTypesInspection(): void {
    this.getTypesInspection().subscribe();
  }

  // ===== INSPECTIONS =====
  getInspections(filtres?: FiltresInspections): Observable<PaginatedResponse<Inspection>> {
    let params = new HttpParams();
    if (filtres) {
      Object.keys(filtres).forEach(key => {
        const value = (filtres as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<any>(`${this.apiUrl}/inspections`, { params })
      .pipe(
        map(response => {
          // Handle both direct response and wrapped response
          if (response.success && response.data) {
            return {
              data: response.data,
              total: response.meta?.total || response.total || response.data.length,
              page: response.meta?.page || 1,
              limit: response.meta?.limit || 10,
              lastPage: response.meta?.lastPage || 1
            };
          }
          return response;
        }),
        tap(response => this.inspectionsSubject.next(response.data)),
        catchError(this.handleError)
      );
  }

  getInspection(id: string): Observable<Inspection> {
    return this.http.get<any>(`${this.apiUrl}/inspections/${id}`)
      .pipe(
        map(response => response.data || response),
        catchError(this.handleError)
      );
  }

  createInspection(data: CreateInspectionDto): Observable<Inspection> {
    console.log('AdminService: Creating inspection with data:', data);
    
    return this.http.post<any>(`${this.apiUrl}/inspections`, data)
      .pipe(
        map(response => {
          console.log('AdminService: Create inspection response:', response);
          // Handle both direct response and wrapped response
          if (response.success && response.data) {
            return response.data;
          }
          return response.data || response;
        }),
        tap(() => this.refreshInspections()),
        catchError(error => {
          console.error('AdminService: Create inspection error:', error);
          return this.handleError(error);
        })
      );
  }

  updateInspection(id: string, data: UpdateInspectionDto): Observable<Inspection> {
    
    return this.http.patch<any>(`${this.apiUrl}/inspections/${id}`, data) // ✅ Correctly sends a PATCH request
      .pipe(
        map(response => response.data || response),
        tap(() => this.refreshInspections()),
        catchError(this.handleError)
      );
  }

  updateEtatInspection(id: string, data: UpdateEtatInspectionDto): Observable<Inspection> {
    return this.http.patch<any>(`${this.apiUrl}/inspections/${id}/etat`, data)
      .pipe(
        map(response => response.data || response),
        tap(() => this.refreshInspections()),
        catchError(this.handleError)
      );
  }

  deleteInspection(id: string): Observable<void> {
    return this.http.delete<any>(`${this.apiUrl}/inspections/${id}`)
      .pipe(
        map(() => void 0),
        tap(() => this.refreshInspections()),
        catchError(this.handleError)
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

  return this.http.get<Actif[]>(`${API_URL}/actifs`, { params })
    .pipe(
      map(directArray => ({
        data: directArray,
        total: directArray.length,
        page: 1,
        limit: directArray.length,
        lastPage: 1,
        totalPages: 1  // Add this missing property
      })),
      tap(response => this.actifsSubject.next(response.data)),
      catchError(this.handleError)
    );
}
  createActif(data: CreateActifDto): Observable<Actif> {
    return this.http.post<ApiResponse<Actif>>(`${API_URL}/actifs`, data)
      .pipe(
        map(response => response.data!),
        tap(() => this.refreshActifs()),
        catchError(this.handleError)
      );
  }

  updateActif(id: string, data: UpdateActifDto): Observable<Actif> {
    return this.http.put<ApiResponse<Actif>>(`${API_URL}/actifs/${id}`, data)
      .pipe(
        map(response => response.data!),
        tap(() => this.refreshActifs()),
        catchError(this.handleError)
      );
  }

  deleteActif(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${API_URL}/actifs/${id}`)
      .pipe(
        map(() => void 0),
        tap(() => this.refreshActifs()),
        catchError(this.handleError)
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
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  // ===== STATISTIQUES =====
  getStatistiques(): Observable<StatistiquesAdmin> {
    return this.http.get<ApiResponse<StatistiquesAdmin>>(`${this.apiUrl}/statistiques`)
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  // ===== UTILITIES =====
  rechercherEntites(terme: string, types: string[] = []): Observable<any[]> {
    let params = new HttpParams().set('q', terme);
    
    if (types.length > 0) {
      params = params.set('types', types.join(','));
    }

    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/recherche`, { params })
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  exporterDonnees(type: string, filtres?: any): Observable<Blob> {
    let params = new HttpParams().set('type', type);
    
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
        map(response => response.data!.disponible),
        catchError(this.handleError)
      );
  }

  // ===== REFRESH METHODS =====
  refreshAll(): void {
    this.refreshUtilisateurs();
    this.refreshFamilles();
    this.refreshGroupes();
    this.refreshTypesInspection();
    this.refreshInspections();
    this.refreshActifs();
  }

  // ===== ERROR HANDLING =====
  private handleError(error: any): Observable<never> {
    console.error('AdminService Error:', error);
    throw error;
  }
}