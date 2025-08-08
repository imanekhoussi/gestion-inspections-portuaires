import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  Actif,
  CreateActifDto, 
  ActifGeoJSON, 
  ActifFamille, 
  ActifGroupe, 
  FilterCriteria, 
  StatistiquesActifs 
} from '../../../core/models/actif.interface';

@Injectable({
  providedIn: 'root'
})
export class ActifsService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createActif(actifData: CreateActifDto): Observable<Actif> {
    return this.http.post<Actif>(`${this.API_URL}/actifs`, actifData)
      .pipe(
        catchError(this.handleError)
      );
  }
  // Basic CRUD operations
  getActifs(): Observable<Actif[]> {
    return this.http.get<Actif[]>(`${this.API_URL}/actifs`)
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  getActifsGeoJSON(filters?: FilterCriteria): Observable<ActifGeoJSON> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.sites?.length) {
        params = params.set('sites', filters.sites.join(','));
      }
      if (filters.zones?.length) {
        params = params.set('zones', filters.zones.join(','));
      }
      if (filters.familles?.length) {
        params = params.set('familles', filters.familles.join(','));
      }
      if (filters.groupes?.length) {
        params = params.set('groupes', filters.groupes.join(','));
      }
      if (filters.etats?.length) {
        params = params.set('etats', filters.etats.join(','));
      }
      if (filters.criticites?.length) {
        params = params.set('criticites', filters.criticites.join(','));
      }
      if (filters.statuts?.length) {
        params = params.set('statuts', filters.statuts.join(','));
      }
    }

    return this.http.get<ActifGeoJSON>(`${this.API_URL}/actifs/geojson`, { params })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  getActifById(id: number): Observable<Actif> {
    return this.http.get<Actif>(`${this.API_URL}/actifs/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Family and Group operations
  getFamilles(): Observable<ActifFamille[]> {
    return this.http.get<ActifFamille[]>(`${this.API_URL}/familles`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  getGroupes(): Observable<ActifGroupe[]> {
    return this.http.get<ActifGroupe[]>(`${this.API_URL}/groupes`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  getGroupesByFamille(familleId: number): Observable<ActifGroupe[]> {
    return this.http.get<ActifGroupe[]>(`${this.API_URL}/familles/${familleId}/groupes`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  // Filtering operations
  getActifsBySite(site: string): Observable<Actif[]> {
    return this.http.get<Actif[]>(`${this.API_URL}/actifs/by-site?site=${encodeURIComponent(site)}`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  getActifsByGroupe(groupeId: number): Observable<Actif[]> {
    return this.http.get<Actif[]>(`${this.API_URL}/actifs/by-groupe/${groupeId}`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  getActifsByFamille(familleId: number): Observable<Actif[]> {
    return this.http.get<Actif[]>(`${this.API_URL}/actifs/by-famille/${familleId}`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  // Statistics
  getStatistiques(): Observable<StatistiquesActifs> {
    return this.http.get<StatistiquesActifs>(`${this.API_URL}/actifs/statistiques`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  getStatistiquesByZone(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/actifs/statistics-by-zone`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  // Search operations
  searchActifs(query: string): Observable<Actif[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<Actif[]>(`${this.API_URL}/actifs/search`, { params })
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  // Geographic operations
  getActifsByCoordinates(lat: number, lng: number, radius: number = 1000): Observable<Actif[]> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lng', lng.toString())
      .set('radius', radius.toString());
    
    return this.http.get<Actif[]>(`${this.API_URL}/actifs/by-coordinates`, { params })
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  // Filter options for UI
  getFilterOptions(): Observable<{
    sites: string[];
    zones: string[];
    familles: ActifFamille[];
    groupes: ActifGroupe[];
    criticites: string[];
    statuts: string[];
  }> {
    return this.http.get<any>(`${this.API_URL}/actifs/filter-options`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur inconnue est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Erreur client: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Impossible de se connecter au serveur';
          break;
        case 401:
          errorMessage = 'Accès non autorisé';
          break;
        case 403:
          errorMessage = 'Accès interdit';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée';
          break;
        case 500:
          errorMessage = 'Erreur interne du serveur';
          break;
        default:
          errorMessage = `Erreur serveur: ${error.status} - ${error.message}`;
      }
    }

    console.error('ActifsService error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}