import { Component, OnInit, inject, signal, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { LogHistoriqueService } from '../../services/log-historique.service';
import { LogHistorique, LogHistoriqueFilter } from '../../../../core/models/log-historique.interface';
import { debounceTime, distinctUntilChanged, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LogDetailDialogComponent } from '../log-detail-dialog/log-detail-dialog.component';


@Component({
  selector: 'app-log-historique-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
  @Input() inspectionId?: string;
  @Input() showFilters: boolean = true;
  @Input() showActions: boolean = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Services
  private readonly logService = inject(LogHistoriqueService);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Table Columns
  displayedColumns: string[] = [
    'dateIntervention', 'intervenant', 'inspection', 'ancienEtat',
    'nouvelEtat', 'commentaire', 'actions'
  ];

  // State Signals
  loading = signal(false);
  error = signal<string | null>(null);
  logs = signal<LogHistorique[]>([]);
  
  // Table Data Source
  dataSource = new MatTableDataSource<LogHistorique>([]);

  // Filter Form
  filterForm: FormGroup;

  constructor() {
    this.filterForm = this.fb.group({
      interventionPar: [''],
      inspectionId: [''],
      dateDebut: [''],
      dateFin: ['']
    });
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
    this.route.paramMap.subscribe(params => {
      const userId = params.get('userId');
      if (userId) {
        this.loadDataForUser(userId);
      } else {
        this.loadData();
      }
    });
  }

  private setupFilterSubscription(): void {
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => this.applyFilters());
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const request$ = this.inspectionId
      ? this.logService.findByInspection(this.inspectionId)
      : this.logService.findAll();

    request$.pipe(
      catchError(err => {
        console.error('Error loading logs:', err);
        this.error.set('Failed to load logs.');
        this.snackBar.open('Error loading logs', 'Close', { duration: 3000 });
        return of([]);
      })
    ).subscribe(logs => {
      this.logs.set(logs);
      this.dataSource.data = logs;
      this.loading.set(false);
    });
  }

  loadDataForUser(userId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.showFilters = false;
    
    this.logService.findByUtilisateur(userId).pipe(
      catchError(err => {
        console.error(`Error loading logs for user ${userId}:`, err);
        this.error.set(`Failed to load logs for user ${userId}.`);
        this.snackBar.open('Error loading user logs', 'Close', { duration: 3000 });
        return of([]);
      })
    ).subscribe(logs => {
      this.logs.set(logs);
      this.dataSource.data = logs;
      this.loading.set(false);
    });
  }

  applyFilters(): void {
    if (this.inspectionId) return;

    const filters: LogHistoriqueFilter = this.filterForm.value;
    // Further filter processing can be added here as needed

    this.loading.set(true);
    this.logService.findAll(filters).pipe(
      catchError(err => {
        console.error('Error applying filters:', err);
        this.error.set('Failed to apply filters.');
        return of([]);
      })
    ).subscribe(logs => {
      this.logs.set(logs);
      this.dataSource.data = logs;
      this.loading.set(false);
    });
  }

  viewDetails(log: LogHistorique): void {
    const dialogRef = this.dialog.open(LogDetailDialogComponent, {
      width: '600px',
      data: log
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'viewInspection') {
        this.viewInspectionHistory(result.inspectionId);
      } else if (result?.action === 'viewUser') {
        this.viewUserActivity(result.userId);
      }
    });
  }

  viewInspectionHistory(inspectionId: string | number): void {
  console.log('Navigating to inspection history for ID:', inspectionId);
  this.router.navigate(['/historique/inspection', inspectionId.toString()]);
}

  viewUserActivity(userId: string | number): void {
  console.log('Navigating to user activity for ID:', userId);
  this.router.navigate(['/historique/utilisateur', userId.toString()]);
}


  formatDate(date: Date | string): string {
    return this.logService.formatDate(date);
  }

  getEtatBadgeClass(etat: string): string {
    return this.logService.getEtatBadgeClass(etat);
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.loadData();
  }

  exportLogs(): void {
    this.snackBar.open('Export feature is not yet implemented.', 'Close', { duration: 2000 });
  }

  refreshData(): void {
    this.initializeComponent();
  }

  toggleStats(): void {
  this.router.navigate(['/historique/statistiques']);
}

  loadActiviteRecente(heures: number = 24): void {
    this.loading.set(true);
    this.logService.getActiviteRecente(heures).pipe(
      catchError(err => {
        console.error('Error loading recent activity:', err);
        this.error.set('Failed to load recent activity.');
        return of([]);
      })
    ).subscribe(logs => {
      this.logs.set(logs);
      this.dataSource.data = logs;
      this.loading.set(false);
    });
  }
}