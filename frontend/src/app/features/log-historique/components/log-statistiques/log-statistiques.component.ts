// src/app/features/log-historique/components/log-statistiques/log-statistiques.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { LogHistoriqueService } from '../../services/log-historique.service';
import { LogHistorique } from '../../../../core/models/log-historique.interface';
import { catchError, forkJoin, of } from 'rxjs';

interface StatistiqueTransition {
  ancien: string;
  nouveau: string;
  count: number;
}

interface StatistiqueGlobale {
  totalActions: number;
  totalIntervenants: number;
  totalInspections: number;
  actionsAujourdhui: number;
  actionsCetteSemaine: number;
}

interface StatistiqueEtat {
  etat: string;
  count: number;
  pourcentage: number;
}

@Component({
  selector: 'app-log-statistiques',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatTabsModule
  ],
  templateUrl: './log-statistiques.component.html',
  styleUrls: ['./log-statistiques.component.scss']
})
export class LogStatistiquesComponent implements OnInit {
  private readonly logService = inject(LogHistoriqueService);
  private readonly snackBar = inject(MatSnackBar);

  // Signals
  loading = signal(false);
  error = signal<string | null>(null);
  statsGlobales = signal<StatistiqueGlobale>({
    totalActions: 0,
    totalIntervenants: 0,
    totalInspections: 0,
    actionsAujourdhui: 0,
    actionsCetteSemaine: 0
  });
  statsTransitions = signal<StatistiqueTransition[]>([]);
  statsEtats = signal<StatistiqueEtat[]>([]);
  topUsers = signal<any[]>([]);
  logsData = signal<LogHistorique[]>([]);

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.loading.set(true);
    this.error.set(null);

    // Pour test, chargez seulement les logs pour voir si ça fonctionne
    this.logService.findAll().pipe(
      catchError(error => {
        console.error('Erreur lors du chargement des statistiques:', error);
        this.error.set('Erreur lors du chargement des statistiques: ' + error.message);
        this.snackBar.open('Erreur lors du chargement des statistiques', 'Fermer', { duration: 3000 });
        return of([]);
      })
    ).subscribe(logs => {
      console.log('Logs reçus:', logs); // Debug
      this.logsData.set(logs);
      this.calculateStatistics(logs, []);
      this.loading.set(false);
    });
  }

  private calculateStatistics(logs: LogHistorique[], transitions: any[]): void {
    console.log('Calcul des statistiques avec', logs.length, 'logs'); // Debug

    // Statistiques globales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const actionsAujourdhui = logs.filter(log => 
      new Date(log.dateIntervention) >= today
    ).length;

    const actionsCetteSemaine = logs.filter(log => 
      new Date(log.dateIntervention) >= weekAgo
    ).length;

    const intervenantsUniques = new Set(
      logs.filter(log => log.intervenant).map(log => log.intervenant!.id)
    );

    const inspectionsUniques = new Set(
      logs.filter(log => log.inspection).map(log => log.inspection!.id)
    );

    this.statsGlobales.set({
      totalActions: logs.length,
      totalIntervenants: intervenantsUniques.size,
      totalInspections: inspectionsUniques.size,
      actionsAujourdhui,
      actionsCetteSemaine
    });

    // Transitions d'états
    const transitionMap = new Map<string, number>();
    logs.forEach(log => {
      const key = `${log.ancienEtat || 'NULL'}=>${log.nouvelEtat || 'NULL'}`;
      transitionMap.set(key, (transitionMap.get(key) || 0) + 1);
    });

    const transitionsArray: StatistiqueTransition[] = Array.from(transitionMap.entries())
      .map(([key, count]) => {
        const [ancien, nouveau] = key.split('=>');
        return {
          ancien: ancien === 'NULL' ? '' : ancien,
          nouveau: nouveau === 'NULL' ? '' : nouveau,
          count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    this.statsTransitions.set(transitionsArray);

    // États
    const etatMap = new Map<string, number>();
    logs.forEach(log => {
      if (log.nouvelEtat) {
        etatMap.set(log.nouvelEtat, (etatMap.get(log.nouvelEtat) || 0) + 1);
      }
    });

    const totalEtats = Array.from(etatMap.values()).reduce((sum, count) => sum + count, 0);
    const etatsArray: StatistiqueEtat[] = Array.from(etatMap.entries())
      .map(([etat, count]) => ({
        etat,
        count,
        pourcentage: totalEtats > 0 ? Math.round((count / totalEtats) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    this.statsEtats.set(etatsArray);

    // Top utilisateurs
    const userMap = new Map<string, any>();
    logs.forEach(log => {
      if (log.intervenant) {
        const userId = log.intervenant.id.toString();
        if (userMap.has(userId)) {
          userMap.get(userId).count++;
        } else {
          userMap.set(userId, {
            ...log.intervenant,
            count: 1
          });
        }
      }
    });

    const topUsersArray = Array.from(userMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    this.topUsers.set(topUsersArray);

    console.log('Statistiques calculées:', {
      globales: this.statsGlobales(),
      transitions: this.statsTransitions(),
      etats: this.statsEtats(),
      topUsers: this.topUsers()
    }); // Debug
  }

  refreshData(): void {
    this.loadStatistics();
  }

  exportStats(): void {
    this.snackBar.open('Export en cours de développement', 'Fermer', { duration: 2000 });
  }

  getEtatBadgeClass(etat: string): string {
    return this.logService.getEtatBadgeClass(etat);
  }

  getMoyenneQuotidienne(): number {
    const logs = this.logsData();
    if (logs.length === 0) return 0;

    const dates = logs.map(log => new Date(log.dateIntervention).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const daysDiff = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;

    return Math.round(logs.length / daysDiff);
  }
}