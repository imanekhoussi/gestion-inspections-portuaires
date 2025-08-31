// UPDATED: src/app/features/log-historique/services/log-historique.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LogHistorique, LogHistoriqueFilter, StatistiqueEtat } from '../../../core/models/log-historique.interface';

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

    return this.http.get<LogHistorique[]>(this.apiUrl, { params });
  }

  // Récupérer les logs d'une inspection
  findByInspection(inspectionId: string): Observable<LogHistorique[]> {
    return this.http.get<LogHistorique[]>(`${this.apiUrl}/inspection/${inspectionId}`);
  }

  // Récupérer les logs d'un utilisateur
  findByUtilisateur(userId: string): Observable<LogHistorique[]> {
    return this.http.get<LogHistorique[]>(`${this.apiUrl}/utilisateur/${userId}`);
  }

  // Récupérer l'activité récente
  getActiviteRecente(heures: number = 24): Observable<LogHistorique[]> {
    const params = new HttpParams().set('heures', heures.toString());
    return this.http.get<LogHistorique[]>(`${this.apiUrl}/activite-recente`, { params });
  }

  // Récupérer les statistiques des états
  getStatistiquesEtats(): Observable<StatistiqueEtat[]> {
    return this.http.get<StatistiqueEtat[]>(`${this.apiUrl}/statistiques-etats`);
  }

  // Récupérer l'historique chronologique d'une inspection
  getHistoriqueChronologique(inspectionId: string): Observable<LogHistorique[]> {
    return this.http.get<LogHistorique[]>(`${this.apiUrl}/inspection/${inspectionId}/chronologique`);
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