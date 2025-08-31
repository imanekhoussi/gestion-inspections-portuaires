// src/app/features/log-historique/components/log-inspection-history/log-inspection-history.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { LogHistoriqueService } from '../../services/log-historique.service';
import { LogHistorique } from '../../../../core/models/log-historique.interface';
import { catchError, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-log-inspection-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './log-inspection-history.component.html',
  styleUrls: ['./log-inspection-history.component.scss']
})
export class LogInspectionHistoryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly logService = inject(LogHistoriqueService);
  private readonly snackBar = inject(MatSnackBar);

  // Signals
  loading = signal(false);
  error = signal<string | null>(null);
  logs = signal<LogHistorique[]>([]);
  inspectionId = signal<string>('');

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('inspectionId');
        if (!id) {
          this.error.set('ID d\'inspection manquant');
          return of([]);
        }
        
        this.inspectionId.set(id);
        this.loading.set(true);
        this.error.set(null);
        
        return this.logService.findByInspection(id);
      }),
      catchError(error => {
        console.error('Erreur lors du chargement de l\'historique:', error);
        this.error.set('Erreur lors du chargement de l\'historique');
        this.snackBar.open('Erreur lors du chargement de l\'historique', 'Fermer', { duration: 3000 });
        return of([]);
      })
    ).subscribe(logs => {
      this.logs.set(logs.sort((a, b) => 
        new Date(b.dateIntervention).getTime() - new Date(a.dateIntervention).getTime()
      ));
      this.loading.set(false);
    });
  }

  refreshData(): void {
    if (this.inspectionId()) {
      this.loading.set(true);
      this.error.set(null);
      
      this.logService.findByInspection(this.inspectionId()).pipe(
        catchError(error => {
          console.error('Erreur lors du rechargement:', error);
          this.error.set('Erreur lors du rechargement');
          this.snackBar.open('Erreur lors du rechargement', 'Fermer', { duration: 3000 });
          return of([]);
        })
      ).subscribe(logs => {
        this.logs.set(logs.sort((a, b) => 
          new Date(b.dateIntervention).getTime() - new Date(a.dateIntervention).getTime()
        ));
        this.loading.set(false);
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/historique']);
  }

  viewUserActivity(userId: string): void {
    this.router.navigate(['/historique/utilisateur', userId]);
  }

  formatDate(date: Date | string): string {
    return this.logService.formatDate(date);
  }

  getEtatBadgeClass(etat: string): string {
    return this.logService.getEtatBadgeClass(etat);
  }

  getMarkerClass(log: LogHistorique): string {
    if (!log.ancienEtat && log.nouvelEtat) return 'marker-creation';
    if (log.ancienEtat && !log.nouvelEtat) return 'marker-deletion';
    if (log.nouvelEtat === 'VALIDEE') return 'marker-validation';
    if (log.ancienEtat && log.nouvelEtat) return 'marker-update';
    return 'marker-default';
  }

  getMarkerIcon(log: LogHistorique): string {
    if (!log.ancienEtat && log.nouvelEtat) return 'add';
    if (log.ancienEtat && !log.nouvelEtat) return 'delete';
    if (log.nouvelEtat === 'VALIDEE') return 'check';
    if (log.ancienEtat && log.nouvelEtat) return 'edit';
    return 'timeline';
  }

  getUniqueIntervenants(): number {
    const intervenants = new Set(
      this.logs()
        .filter(log => log.intervenant)
        .map(log => log.intervenant!.id)
    );
    return intervenants.size;
  }

  getDurationDays(): number {
    const logs = this.logs();
    if (logs.length < 2) return 1;
    
    const dates = logs.map(log => new Date(log.dateIntervention).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    
    return Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
  }
}