import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LogHistorique, LogHistoriqueFilter, StatistiqueEtat } from '../../../core/models/log-historique.interface';

import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface LogSearchParams {
  utilisateurId?: string;
  inspectionId?: string;
  dateDebut?: Date;
  dateFin?: Date;
  ancienEtat?: string[];
  nouvelEtat?: string[];
  hasCommentaire?: boolean;
  searchText?: string;
}
@Injectable({
  providedIn: 'root'
})
export class LogHistoriqueService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl || 'http://localhost:3000/api'}/logs`;

  // Récupérer tous les logs
  findAll(filters?: LogHistoriqueFilter): Observable<LogHistorique[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.interventionPar) params = params.set('interventionPar', filters.interventionPar);
      if (filters.inspectionId) params = params.set('inspectionId', filters.inspectionId);
      if (filters.dateDebut) params = params.set('dateDebut', filters.dateDebut);
      if (filters.dateFin) params = params.set('dateFin', filters.dateFin);
    }

    return this.http.get<LogHistorique[]>(this.apiUrl, { params }).pipe(
    catchError(error => {
      console.error('Erreur lors du chargement des logs:', error);
      return of([]);
  }));}

  findByInspection(inspectionId: string): Observable<LogHistorique[]> {
    return this.http.get<LogHistorique[]>(`${this.apiUrl}/inspection/${inspectionId}`).pipe(
    catchError(error => {
      console.error('Erreur lors du chargement des logs de l\'inspection:', error);
      return of([]);
    })
  );
}
  
  findByUtilisateur(userId: string): Observable<LogHistorique[]> {
    return this.http.get<LogHistorique[]>(`${this.apiUrl}/utilisateur/${userId}`).pipe(
    catchError(error => {
      console.error('Erreur lors du chargement des logs utilisateur:', error);
      return of([]);
    })
  );
}
  

  getActiviteRecente(heures: number = 24): Observable<LogHistorique[]> {
    const params = new HttpParams().set('heures', heures.toString());
    return this.http.get<LogHistorique[]>(`${this.apiUrl}/activite-recente`, { params });
  }

  getStatistiquesEtats(): Observable<StatistiqueEtat[]> {
    return this.http.get<StatistiqueEtat[]>(`${this.apiUrl}/statistiques-etats`);
  }

  getHistoriqueChronologique(inspectionId: string): Observable<LogHistorique[]> {
    return this.http.get<LogHistorique[]>(`${this.apiUrl}/inspection/${inspectionId}/chronologique`);
  }


  filterLogsLocally(logs: LogHistorique[], searchText: string): LogHistorique[] {
  if (!searchText || !searchText.trim()) {
    return logs;
  }

  const searchTerm = searchText.toLowerCase().trim();
  
  return logs.filter(log => 
    log.intervenant?.nom?.toLowerCase().includes(searchTerm) ||
    log.intervenant?.prenom?.toLowerCase().includes(searchTerm) ||
    log.intervenant?.email?.toLowerCase().includes(searchTerm) ||
    log.inspection?.titre?.toLowerCase().includes(searchTerm) ||
    log.commentaire?.toLowerCase().includes(searchTerm) ||
    log.ancienEtat?.toLowerCase().includes(searchTerm) ||
    log.nouvelEtat?.toLowerCase().includes(searchTerm)
  );
}


sortLogs(logs: LogHistorique[], sortBy: string, direction: 'asc' | 'desc' = 'desc'): LogHistorique[] {
  const sortedLogs = [...logs];
  
  return sortedLogs.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'dateIntervention':
        comparison = new Date(a.dateIntervention).getTime() - new Date(b.dateIntervention).getTime();
        break;
        
      case 'intervenant':
        const nameA = `${a.intervenant?.nom || ''} ${a.intervenant?.prenom || ''}`.trim();
        const nameB = `${b.intervenant?.nom || ''} ${b.intervenant?.prenom || ''}`.trim();
        comparison = nameA.localeCompare(nameB);
        break;
        
      case 'inspection':
        const inspectionA = a.inspection?.titre || '';
        const inspectionB = b.inspection?.titre || '';
        comparison = inspectionA.localeCompare(inspectionB);
        break;
        
      case 'ancienEtat':
        comparison = (a.ancienEtat || '').localeCompare(b.ancienEtat || '');
        break;
        
      case 'nouvelEtat':
        comparison = (a.nouvelEtat || '').localeCompare(b.nouvelEtat || '');
        break;
        
      default:
        comparison = new Date(a.dateIntervention).getTime() - new Date(b.dateIntervention).getTime();
    }
    
    return direction === 'asc' ? comparison : -comparison;
  });
}


applyAdvancedFilters(logs: LogHistorique[], filters: LogSearchParams): LogHistorique[] {
  let filteredLogs = [...logs];

  // Filtre par utilisateur
  if (filters.utilisateurId?.trim()) {
    const userFilter = filters.utilisateurId.toLowerCase().trim();
    filteredLogs = filteredLogs.filter(log => 
      log.intervenant?.id?.includes(userFilter) ||
      log.intervenant?.nom?.toLowerCase().includes(userFilter) ||
      log.intervenant?.prenom?.toLowerCase().includes(userFilter) ||
      log.intervenant?.email?.toLowerCase().includes(userFilter)
    );
  }

  // Filtre par inspection
  if (filters.inspectionId?.trim()) {
    const inspectionFilter = filters.inspectionId.toLowerCase().trim();
    filteredLogs = filteredLogs.filter(log => 
      log.inspection?.id?.includes(inspectionFilter) ||
      log.inspection?.titre?.toLowerCase().includes(inspectionFilter)
    );
  }

  // Filtre par date de début
  if (filters.dateDebut) {
    filteredLogs = filteredLogs.filter(log => 
      new Date(log.dateIntervention) >= filters.dateDebut!
    );
  }

  // Filtre par date de fin
  if (filters.dateFin) {
    const endDate = new Date(filters.dateFin);
    endDate.setHours(23, 59, 59, 999);
    filteredLogs = filteredLogs.filter(log => 
      new Date(log.dateIntervention) <= endDate
    );
  }

  // Filtre par ancien état
  if (filters.ancienEtat && filters.ancienEtat.length > 0) {
    filteredLogs = filteredLogs.filter(log => 
      !log.ancienEtat || filters.ancienEtat!.includes(log.ancienEtat)
    );
  }

  // Filtre par nouvel état
  if (filters.nouvelEtat && filters.nouvelEtat.length > 0) {
    filteredLogs = filteredLogs.filter(log => 
      !log.nouvelEtat || filters.nouvelEtat!.includes(log.nouvelEtat)
    );
  }

  // Filtre par présence de commentaire
  if (filters.hasCommentaire !== undefined) {
    filteredLogs = filteredLogs.filter(log => 
      filters.hasCommentaire ? !!log.commentaire?.trim() : !log.commentaire?.trim()
    );
  }

  // Recherche textuelle globale
  if (filters.searchText?.trim()) {
    filteredLogs = this.filterLogsLocally(filteredLogs, filters.searchText);
  }

  return filteredLogs;
}


calculateQuickStats(logs: LogHistorique[]): {
  totalLogs: number;
  uniqueUsers: number;
  uniqueInspections: number;
  actionsToday: number;
  actionsThisWeek: number;
} {
  const uniqueUsers = new Set(logs.map(log => log.intervenant?.id).filter(Boolean));
  const uniqueInspections = new Set(logs.map(log => log.inspection?.id).filter(Boolean));
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const actionsToday = logs.filter(log => 
    new Date(log.dateIntervention) >= today
  ).length;
  
  const actionsThisWeek = logs.filter(log => 
    new Date(log.dateIntervention) >= weekAgo
  ).length;
  
  return {
    totalLogs: logs.length,
    uniqueUsers: uniqueUsers.size,
    uniqueInspections: uniqueInspections.size,
    actionsToday,
    actionsThisWeek
  };
}

  // Utilitaires
  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEtatBadgeClass(etat: string): string {
    const classes: { [key: string]: string } = {
      'PROGRAMMEE': 'badge-warning',
      'EN_COURS': 'badge-info', 
      'TERMINEE': 'badge-success',
      'VALIDEE': 'badge-success',
      'ANNULEE': 'badge-danger',
      'REPORTEE': 'badge-warning',
      'SUSPENDUE': 'badge-danger'
    };
    return classes[etat] || 'badge-light';
  }

  // Méthode pour créer un log (utilisée par d'autres services)
  createLog(data: Partial<LogHistorique>): Observable<LogHistorique> {
    return this.http.post<LogHistorique>(this.apiUrl, data);
  }

  // Méthode helper pour les changements d'état d'inspection
  logEtatChange(
    inspectionId: string, 
    ancienEtat: string | null, 
    nouvelEtat: string | null, 
    commentaire?: string
  ): Observable<LogHistorique> {
    return this.createLog({
      inspectionId,
      ancienEtat: ancienEtat || undefined,
      nouvelEtat: nouvelEtat || undefined,
      commentaire
    });
  }
}