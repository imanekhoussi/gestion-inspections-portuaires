// src/app/features/inspections/services/inspections.service.ts - FIXED IMPORTS

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
  Inspection, 
  EtatInspection, 
  CalendarInspection,
  CloturerInspectionDto,
  ValiderInspectionDto,
  RejeterInspectionDto,
  ApiResponse,
  Livrable,
  LogHistorique
} from '../../../models/inspection.interface';
import { AuthService } from '../../../core/services/auth.services';
export interface CalendarEventData {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class InspectionsService {
  private readonly API_URL = `${environment.apiUrl}/admin/inspections`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHttpOptions() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  // Get all inspections with pagination
  getInspections(options?: {
    page?: number;
    limit?: number;
    search?: string;
    etat?: EtatInspection;
  }): Observable<{data: Inspection[], total: number, page: number, limit: number, lastPage: number}> {
    let params = new HttpParams();
    
    if (options?.page) params = params.set('page', options.page.toString());
    if (options?.limit) params = params.set('limit', options.limit.toString());
    if (options?.search) params = params.set('search', options.search);
    if (options?.etat) params = params.set('etat', options.etat);

    return this.http.get<any>(`${this.API_URL}`, { 
  ...this.getHttpOptions(), 
  params 
}).pipe(
  map(response => {
    if (response.success && response.data) {
      // ✅ CORRECTION: Restructurer selon votre backend
      return {
        data: response.data,           // array des inspections
        total: response.meta.total,    // depuis meta
        page: response.meta.page,      // depuis meta  
        limit: response.meta.limit,    // depuis meta
        lastPage: response.meta.lastPage // depuis meta
      };
    }
    throw new Error(response.message || 'Erreur lors de la récupération des inspections');
  }),
      catchError(this.handleError)
    );
  }

  // Get inspection details with relations
  getInspectionById(id: number): Observable<Inspection> {
    return this.http.get<ApiResponse<Inspection>>(`${this.API_URL}/${id}`, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Erreur lors de la récupération de l\'inspection');
        }),
        catchError(this.handleError)
      );
  }

  // Get inspections for calendar
  getInspectionsForCalendar(startDate: string, endDate: string): Observable<CalendarInspection[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<ApiResponse<CalendarInspection[]>>(`${this.API_URL}/calendar`, { 
      ...this.getHttpOptions(), 
      params 
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Erreur lors de la récupération du calendrier');
      }),
      catchError(this.handleError)
    );
  }

getInspectionLivrables(inspectionId: number): Observable<any[]> {
  return this.http.get<any>(`${environment.apiUrl}/livrables/by-inspection/${inspectionId}`, this.getHttpOptions())
    .pipe(
      map(response => response || []),
      catchError(() => [])  // ← Plus simple, renvoie directement un array vide
    );
}

getInspectionHistorique(inspectionId: number): Observable<any[]> {
  return this.http.get<any>(`${environment.apiUrl}/logs/inspection/${inspectionId}`, this.getHttpOptions())
    .pipe(
      map(response => response || []),
      catchError(() => [])  // ← Plus simple
    );
}
updateInspection(id: number, data: any): Observable<Inspection> {
  return this.http.patch<ApiResponse<Inspection>>(`${this.API_URL}/${id}`, data, this.getHttpOptions())
    .pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Erreur lors de la mise à jour');
      }),
      catchError(this.handleError)
    );
}
demarrerInspection(inspectionId: number): Observable<Inspection> {
  return this.http.post<ApiResponse<Inspection>>(`${this.API_URL}/${inspectionId}/demarrer`, {}, this.getHttpOptions())
    .pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Erreur lors du démarrage');
      }),
      catchError(this.handleError)
    );
}

  // Delete inspection
  deleteInspection(id: number): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${id}`, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.success) {
            return response.data;
          }
          throw new Error(response.message || 'Erreur lors de la suppression');
        }),
        catchError(this.handleError)
      );
  }

  // Clôturer inspection (for OPERATEUR role)
  cloturerInspection(inspectionId: number, data: CloturerInspectionDto): Observable<Inspection> {
    return this.http.post<ApiResponse<Inspection>>(`${this.API_URL}/${inspectionId}/cloturer`, data, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Erreur lors de la clôture');
        }),
        catchError(this.handleError)
      );
  }

  // Valider inspection (for MAITRE_OUVRAGE role)
  validerInspection(inspectionId: number, data: ValiderInspectionDto): Observable<Inspection> {
    return this.http.post<ApiResponse<Inspection>>(`${this.API_URL}/${inspectionId}/valider`, data, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Erreur lors de la validation');
        }),
        catchError(this.handleError)
      );
  }

  // Rejeter inspection (for MAITRE_OUVRAGE role)
  rejeterInspection(inspectionId: number, data: RejeterInspectionDto): Observable<Inspection> {
    return this.http.post<ApiResponse<Inspection>>(`${this.API_URL}/${inspectionId}/rejeter`, data, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Erreur lors du rejet');
        }),
        catchError(this.handleError)
      );
  }

  // Upload files to inspection
  uploadLivrables(inspectionId: number, files: FileList): Observable<any> {
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData - browser will set it automatically with boundary
    });

return this.http.post<any>(`${environment.apiUrl}/livrables/upload-multiple/${inspectionId}`, formData, { headers })      .pipe(
        map(response => {
          if (response.success) {
            return response.data;
          }
          throw new Error(response.message || 'Erreur lors de l\'upload');
        }),
        catchError(this.handleError)
      );
  }

  // Download livrable
  downloadLivrable(inspectionId: number, livrableId: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/livrables/${livrableId}/download`, {
      ...this.getHttpOptions(),
      responseType: 'blob'
    });
  }

  // Check user permissions for inspection actions
  canUserCloseInspection(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'operateur' || user?.role === 'admin';
  }

  canUserValidateInspection(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'maitre_ouvrage' || user?.role === 'admin';
  }

  getUserRole(): string | undefined {
    return this.authService.getCurrentUser()?.role;
  }

  // Helper method to get état label in French
  getEtatLabel(etat: EtatInspection): string {
    switch (etat) {
      case EtatInspection.PROGRAMMEE: return 'Planifiée';
      case EtatInspection.EN_COURS: return 'En cours';
      case EtatInspection.CLOTUREE: return 'Clôturée';
      case EtatInspection.VALIDEE: return 'Validée';
      case EtatInspection.REJETEE: return 'Rejetée';
      default: return etat;
    }
  }

  // Helper method to check if inspection can be closed
  canCloseInspection(inspection: Inspection): boolean {
    return inspection.etat === EtatInspection.EN_COURS && this.canUserCloseInspection();
  }

  // Helper method to check if inspection can be validated/rejected
  canValidateInspection(inspection: Inspection): boolean {
    return inspection.etat === EtatInspection.CLOTUREE && this.canUserValidateInspection();
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (typeof error.error === 'string') {
      errorMessage = error.error;
    }

    return throwError(() => new Error(errorMessage));
  }
}