import { Component, OnInit, inject, signal, computed, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
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
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, takeUntil, catchError } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';

import { LogHistoriqueService } from '../../services/log-historique.service';
import { LogHistorique, LogHistoriqueFilter } from '../../../../core/models/log-historique.interface';
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
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
    MatDialogModule,
    FormsModule,
    MatDividerModule
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

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly logService = inject(LogHistoriqueService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  // Variables pour la recherche avancée
  userSearchText = '';
  inspectionSearchText = '';

  // Signals
  loading = signal(false);
  error = signal<string | null>(null);
  logs = signal<LogHistorique[]>([]);
  filteredLogs = signal<LogHistorique[]>([]);
  inspectionIdSignal = signal<string | null>(null);

  // Formulaires
  searchForm!: FormGroup;
  filterForm!: FormGroup;
  dataSource = new MatTableDataSource<LogHistorique>([]);
  displayedColumns: string[] = [
    'dateIntervention',
    'intervenant', 
    'inspection',
    'ancienEtat',
    'nouvelEtat',
    'commentaire',
    'actions'
  ];

  // Computed
  totalLogs = computed(() => this.logs().length);
  filteredCount = computed(() => this.filteredLogs().length);

  ngOnInit(): void {
    this.initializeForms();
    this.setupSearchSubscription();
    this.initializeComponent();
    
    // Vérifier si on est dans le contexte d'une inspection spécifique
    const inspectionId = this.route.snapshot.paramMap.get('inspectionId') || this.inspectionId;
    if (inspectionId) {
      this.inspectionIdSignal.set(inspectionId);
      this.inspectionId = inspectionId;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private initializeForms(): void {
    // Formulaire de recherche simple
    this.searchForm = this.fb.group({
      searchText: ['']
    });

    // Formulaire de filtres avancés
    this.filterForm = this.fb.group({
      interventionPar: [''],
      inspectionId: [''],
      dateDebut: [''],
      dateFin: ['']
    });
  }

  private setupSearchSubscription(): void {
    // Recherche simple
    this.searchForm.get('searchText')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applySearch();
    });

    // Filtres avancés
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
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

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const inspectionId = this.inspectionIdSignal();
    const loadMethod = inspectionId 
      ? this.logService.findByInspection(inspectionId)
      : this.logService.findAll();

    loadMethod.pipe(
      catchError(error => {
        console.error('Erreur lors du chargement des logs:', error);
        this.error.set('Erreur lors du chargement des données');
        this.snackBar.open('Erreur lors du chargement des données', 'Fermer', { duration: 3000 });
        return of([]);
      })
    ).subscribe(logs => {
      const sortedLogs = logs.sort((a, b) => 
        new Date(b.dateIntervention).getTime() - new Date(a.dateIntervention).getTime()
      );
      
      this.logs.set(sortedLogs);
      this.filteredLogs.set([...sortedLogs]);
      this.updateDataSource();
      this.loading.set(false);
    });
  }

  private loadDataForUser(userId: string): void {
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
      const sortedLogs = logs.sort((a, b) => 
        new Date(b.dateIntervention).getTime() - new Date(a.dateIntervention).getTime()
      );
      
      this.logs.set(sortedLogs);
      this.filteredLogs.set([...sortedLogs]);
      this.updateDataSource();
      this.loading.set(false);
    });
  }

  private applySearch(): void {
    const searchText = this.searchForm.get('searchText')?.value?.trim() || '';
    
    if (!searchText) {
      this.filteredLogs.set([...this.logs()]);
    } else {
      const filtered = this.logService.filterLogsLocally(this.logs(), searchText);
      this.filteredLogs.set(filtered);
    }
    
    this.updateDataSource();
  }

  private applyFilters(): void {
    if (this.inspectionId) return;

    const filters: LogHistoriqueFilter = this.filterForm.value;
    
    this.loading.set(true);
    this.logService.findAll(filters).pipe(
      catchError(err => {
        console.error('Error applying filters:', err);
        this.error.set('Failed to apply filters.');
        return of([]);
      })
    ).subscribe(logs => {
      const sortedLogs = logs.sort((a, b) => 
        new Date(b.dateIntervention).getTime() - new Date(a.dateIntervention).getTime()
      );
      
      this.logs.set(sortedLogs);
      this.filteredLogs.set([...sortedLogs]);
      this.updateDataSource();
      this.loading.set(false);
    });
  }

  private updateDataSource(): void {
    this.dataSource.data = this.filteredLogs();
    
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  // ===== MÉTHODES POUR LA RECHERCHE AVANCÉE =====
  applyUserFilter(): void {
    const searchText = this.userSearchText.trim();
    if (!searchText) return;

    const filtered = this.logs().filter(log => {
      if (!log.intervenant) return false;
      
      const fullName = `${log.intervenant.nom} ${log.intervenant.prenom}`.toLowerCase();
      const email = log.intervenant.email?.toLowerCase() || '';
      const searchLower = searchText.toLowerCase();
      
      return fullName.includes(searchLower) || 
             email.includes(searchLower) ||
             log.intervenant.nom.toLowerCase().includes(searchLower) ||
             log.intervenant.prenom.toLowerCase().includes(searchLower);
    });

    this.filteredLogs.set(filtered);
    this.updateDataSource();

    const snackBarRef = this.snackBar.open(
      `Filtre appliqué: "${searchText}" (${filtered.length} résultat(s))`, 
      'Annuler', 
      { duration: 5000 }
    );
    
    snackBarRef.onAction().subscribe(() => {
      this.resetFilters();
    });
  }

  applyInspectionFilter(): void {
    const searchText = this.inspectionSearchText.trim();
    if (!searchText) return;

    const filtered = this.logs().filter(log => {
      if (!log.inspection) return false;
      
      const title = log.inspection.titre.toLowerCase();
      const id = log.inspection.id.toLowerCase();
      const searchLower = searchText.toLowerCase();
      
      return title.includes(searchLower) || id.includes(searchLower);
    });

    this.filteredLogs.set(filtered);
    this.updateDataSource();

    const snackBarRef = this.snackBar.open(
      `Filtre appliqué: "${searchText}" (${filtered.length} résultat(s))`, 
      'Annuler', 
      { duration: 5000 }
    );
    
    snackBarRef.onAction().subscribe(() => {
      this.resetFilters();
    });
  }

  clearUserFilter(): void {
    this.userSearchText = '';
  }

  clearInspectionFilter(): void {
    this.inspectionSearchText = '';
  }

  clearSearch(): void {
    this.searchForm.patchValue({ searchText: '' });
  }

  resetFilters(): void {
    this.clearSearch();
    this.userSearchText = '';
    this.inspectionSearchText = '';
    this.filterForm.reset();
    this.filteredLogs.set([...this.logs()]);
    this.updateDataSource();
    this.snackBar.open('Filtres réinitialisés', 'OK', { duration: 2000 });
  }

  loadActiviteRecente(heures: number): void {
    const dateLimit = new Date();
    dateLimit.setHours(dateLimit.getHours() - heures);
    
    const filtered = this.logs().filter(log => 
      new Date(log.dateIntervention) >= dateLimit
    );
    
    this.filteredLogs.set(filtered);
    this.updateDataSource();
    
    const label = heures === 1 ? 'dernière heure' : 
                  heures === 24 ? 'dernières 24h' : 'dernière semaine';
    this.snackBar.open(`Filtre appliqué: ${label}`, 'OK', { duration: 2000 });
  }

  // ===== ACTIONS FONCTIONNELLES (de l'ancien code) =====
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

  // ===== MÉTHODES UTILITAIRES =====
  formatDate(date: Date | string): string {
    return this.logService.formatDate(date);
  }

  getEtatBadgeClass(etat: string): string {
    if (!etat) return 'badge-light';
    
    const etatLower = etat.toLowerCase().replace(/[_\s]/g, '-');
    
    switch (etatLower) {
      case 'en-cours':
      case 'en_cours':
        return 'etat-badge badge-en-cours';
      
      case 'programmee':
      case 'programmée':
      case 'planifiee':
      case 'planifiée':
        return 'etat-badge badge-programmee';
      
      case 'cloturee':
      case 'clôturée':
      case 'cloture':
      case 'clôture':
        return 'etat-badge badge-cloturee';
      
      case 'validee':
      case 'validée':
      case 'valide':
      case 'validé':
        return 'etat-badge badge-validee';
      
      case 'annulee':
      case 'annulée':
      case 'annule':
      case 'annulé':
        return 'etat-badge badge-annulee';
      
      case 'suspendue':
      case 'suspendu':
      case 'pause':
        return 'etat-badge badge-suspendue';
      
      case 'en-attente':
      case 'en_attente':
      case 'attente':
        return 'etat-badge badge-en-attente';
      
      default:
        return 'etat-badge badge-light';
    }
  }

  getLogTypeClass(log: LogHistorique): string {
    if (!log.ancienEtat && log.nouvelEtat) {
      return 'creation';
    }
    
    if (log.ancienEtat && !log.nouvelEtat) {
      return 'suppression';
    }
    
    if (log.nouvelEtat?.toLowerCase().includes('valid')) {
      return 'validation';
    }
    
    return 'modification';
  }

  shouldHighlightRow(log: LogHistorique): boolean {
    return log.nouvelEtat?.toLowerCase().includes('valid') || false;
  }

  getActionButtonClass(actionType: 'details' | 'history' | 'user'): string {
    switch (actionType) {
      case 'details':
        return 'action-details';
      case 'history':
        return 'action-history';
      case 'user':
        return 'action-user';
      default:
        return '';
    }
  }

  formatEtatWithIcon(etat: string | null): { text: string; icon: string } {
    if (!etat) {
      return { text: 'Non défini', icon: 'help_outline' };
    }
    
    const etatLower = etat.toLowerCase();
    
    switch (etatLower) {
      case 'en_cours':
      case 'en-cours':
        return { text: 'En Cours', icon: 'play_circle' };
      
      case 'programmee':
      case 'programmée':
        return { text: 'Programmée', icon: 'schedule' };
      
      case 'cloturee':
      case 'clôturée':
        return { text: 'Clôturée', icon: 'check_circle' };
      
      case 'validee':
      case 'validée':
        return { text: 'Validée', icon: 'verified' };
      
      case 'annulee':
      case 'annulée':
        return { text: 'Annulée', icon: 'cancel' };
      
      case 'suspendue':
        return { text: 'Suspendue', icon: 'pause_circle' };
      
      case 'en_attente':
      case 'en-attente':
        return { text: 'En Attente', icon: 'hourglass_empty' };
      
      default:
        return { text: etat, icon: 'info' };
    }
  }

  getLogPriority(log: LogHistorique): 'high' | 'medium' | 'low' {
    if (log.nouvelEtat?.toLowerCase().includes('valid') || 
        log.nouvelEtat?.toLowerCase().includes('annul')) {
      return 'high';
    }
    
    if (!log.ancienEtat || log.nouvelEtat?.toLowerCase().includes('clotur')) {
      return 'medium';
    }
    
    return 'low';
  }

  // ===== AUTRES ACTIONS =====
  refreshData(): void {
    this.initializeComponent();
  }

  exportLogs(): void {
    const dataToExport = this.filteredLogs();
    this.snackBar.open(`Export de ${dataToExport.length} logs en cours...`, 'OK', { duration: 2000 });
  }

  toggleStats(): void {
    this.router.navigate(['/historique/statistiques']);
  }

  getUniqueUsers(): Array<{id: string, nom: string, prenom: string}> {
    const users = new Map();
    this.logs().forEach(log => {
      if (log.intervenant) {
        users.set(log.intervenant.id, {
          id: log.intervenant.id,
          nom: log.intervenant.nom,
          prenom: log.intervenant.prenom
        });
      }
    });
    return Array.from(users.values());
  }

  getUniqueInspections(): Array<{id: string, titre: string}> {
    const inspections = new Map();
    this.logs().forEach(log => {
      if (log.inspection) {
        inspections.set(log.inspection.id, {
          id: log.inspection.id,
          titre: log.inspection.titre
        });
      }
    });
    return Array.from(inspections.values());
  }

  // TrackBy functions
  trackByUserId(index: number, item: any): any {
    return item.intervenant?.id || index;
  }

  trackByInspectionId(index: number, item: any): any {
    return item.inspection?.id || index;
  }
}