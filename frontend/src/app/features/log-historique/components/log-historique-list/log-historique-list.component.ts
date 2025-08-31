// src/app/features/log-historique/components/log-historique-list/log-historique-list.component.ts

import { Component, OnInit, inject, signal, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { LogHistoriqueService } from '../../services/log-historique';
import { LogHistorique, LogHistoriqueFilter } from '../../../../core/models/log-historique.interface';
import { debounceTime, distinctUntilChanged, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-log-historique-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    
    // Angular Material
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './log-historique-list.component.html',
  styleUrls: ['./log-historique-list.component.scss']
})
export class LogHistoriqueListComponent implements OnInit {
  @Input() inspectionId?: string; // Pour afficher les logs d'une inspection spécifique
  @Input() showFilters: boolean = true;
  @Input() showActions: boolean = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Services injectés
  private readonly logService = inject(LogHistoriqueService);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  // Configuration du tableau
  displayedColumns: string[] = [
    'dateIntervention',
    'intervenant',
    'inspection',
    'ancienEtat',
    'nouvelEtat',
    'commentaire',
    'actions'
  ];

  // Signals pour la gestion d'état
  loading = signal(false);
  error = signal<string | null>(null);
  logs = signal<LogHistorique[]>([]);
  showStats = signal(false);

  // Données pour le tableau
  dataSource = new MatTableDataSource<LogHistorique>([]);

  // Formulaire de filtres
  filterForm: FormGroup;

  constructor() {
    this.filterForm = this.fb.group({
      interventionPar: [''],
      inspectionId: [''],
      dateDebut: [''],
      dateFin: ['']
    });

    // Ajuster les colonnes selon le contexte
    if (this.inspectionId) {
      this.displayedColumns = this.displayedColumns.filter(col => col !== 'inspection');
    }
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.setupFilterSubscription();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private initializeComponent(): void {
    this.loadData();
  }

  private setupFilterSubscription(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  // Chargement des données
  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const request$ = this.inspectionId
      ? this.logService.findByInspection(this.inspectionId)
      : this.logService.findAll();

    request$.pipe(
      catchError(error => {
        console.error('Erreur lors du chargement des logs:', error);
        this.error.set('Erreur lors du chargement des logs');
        this.snackBar.open('Erreur lors du chargement des logs', 'Fermer', { duration: 3000 });
        return of([]);
      })
    ).subscribe(logs => {
      this.logs.set(logs);
      this.dataSource.data = logs;
      this.loading.set(false);
    });
  }

  // Application des filtres
  applyFilters(): void {
    if (this.inspectionId) {
      // En mode inspection spécifique, pas de filtres avancés
      return;
    }

    const filters: LogHistoriqueFilter = {};
    const formValue = this.filterForm.value;

    if (formValue.interventionPar) {
      filters.interventionPar = formValue.interventionPar;
    }
    if (formValue.inspectionId) {
      filters.inspectionId = formValue.inspectionId;
    }
    if (formValue.dateDebut) {
      filters.dateDebut = this.formatDateForApi(formValue.dateDebut);
    }
    if (formValue.dateFin) {
      filters.dateFin = this.formatDateForApi(formValue.dateFin);
    }

    if (Object.keys(filters).length === 0) {
      this.loadData();
      return;
    }

    this.loading.set(true);
    this.logService.findAll(filters).pipe(
      catchError(error => {
        console.error('Erreur lors de l\'application des filtres:', error);
        this.error.set('Erreur lors de l\'application des filtres');
        this.snackBar.open('Erreur lors de l\'application des filtres', 'Fermer', { duration: 3000 });
        return of([]);
      })
    ).subscribe(logs => {
      this.logs.set(logs);
      this.dataSource.data = logs;
      this.loading.set(false);
    });
  }

  // Actions du tableau
  viewDetails(log: LogHistorique): void {
    // Pour l'instant, juste un log - vous pourrez ajouter un dialog plus tard
    console.log('Détails du log:', log);
    this.snackBar.open('Fonctionnalité en développement', 'Fermer', { duration: 2000 });
  }

  viewInspectionHistory(inspectionId: string): void {
    this.router.navigate(['/logs/inspection', inspectionId]);
  }

  viewUserActivity(userId: string): void {
    this.router.navigate(['/logs/utilisateur', userId]);
  }

  // Utilitaires d'affichage
  formatDate(date: Date | string): string {
    return this.logService.formatDate(date);
  }

  getEtatBadgeClass(etat: string): string {
    return this.logService.getEtatBadgeClass(etat);
  }

  // Actions du composant
  resetFilters(): void {
    this.filterForm.reset();
    this.loadData();
  }

  exportLogs(): void {
    // Implémentation de l'export
    this.snackBar.open('Export en cours de développement', 'Fermer', { duration: 2000 });
  }

  refreshData(): void {
    this.loadData();
  }

  toggleStats(): void {
    this.showStats.update(value => !value);
  }

  // Gestion de l'activité récente
  loadActiviteRecente(heures: number = 24): void {
    this.loading.set(true);
    this.logService.getActiviteRecente(heures).pipe(
      catchError(error => {
        console.error('Erreur lors du chargement de l\'activité récente:', error);
        this.error.set('Erreur lors du chargement de l\'activité récente');
        this.snackBar.open('Erreur lors du chargement de l\'activité récente', 'Fermer', { duration: 3000 });
        return of([]);
      })
    ).subscribe(logs => {
      this.logs.set(logs);
      this.dataSource.data = logs;
      this.loading.set(false);
    });
  }

  private formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}