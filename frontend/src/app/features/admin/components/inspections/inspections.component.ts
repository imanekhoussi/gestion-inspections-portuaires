// src/app/features/admin/components/inspections/inspections.component.ts

import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, merge } from 'rxjs';

import { AdminService } from '../../services/admin.service';
import { NotificationAdminService } from '../../services/notification-admin.service';
import {
  Inspection,
  TypeInspection,
  Actif,
  Utilisateur,
  EtatInspection,
  CreateInspectionDto,
  FiltresInspections
} from '../../../../core/models/admin.interfaces';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { InspectionDialogComponent, InspectionDialogData } from './inspection-dialog/inspection-dialog.component';

interface EtatInspectionOption {
  value: EtatInspection;
  label: string;
  color: string;
  icon: string;
}

interface TableColumn {
  key: string;
  label: string;
  icon: string;
  sortable: boolean;
}

// Extend the FiltresInspections interface to include the missing date range properties
interface ComponentFiltres extends FiltresInspections {
    dateDebutMin?: Date;
    dateDebutMax?: Date;
}


@Component({
  selector: 'app-inspections',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule, ReactiveFormsModule, RouterModule,
    MatTableModule, MatPaginatorModule, MatSortModule, MatDialogModule,
    MatSnackBarModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule,
    MatChipsModule, MatDatepickerModule, MatProgressSpinnerModule,
    MatMenuModule, MatListModule, MatDividerModule
  ],
  templateUrl: './inspections.component.html',
  styleUrls: ['./inspections.component.scss']
})
export class InspectionsComponent implements OnInit, AfterViewInit, OnDestroy {
  // ===== TABLE CONFIGURATION =====
  availableColumns: TableColumn[] = [
    { key: 'titre', label: 'Inspection', icon: 'title', sortable: true },
    { key: 'type', label: 'Type', icon: 'category', sortable: true },
    { key: 'periode', label: 'Période', icon: 'date_range', sortable: true },
    { key: 'etat', label: 'État', icon: 'flag', sortable: true },
    { key: 'actifs', label: 'Actifs', icon: 'inventory', sortable: false },
    { key: 'inspecteur', label: 'Inspecteur', icon: 'person', sortable: false },
    { key: 'actions', label: 'Actions', icon: 'settings', sortable: false }
  ];

  displayedColumns: string[] = ['titre', 'type', 'periode', 'etat', 'actifs', 'inspecteur', 'actions'];
  visibleColumns: string[] = [...this.displayedColumns];

  dataSource = new MatTableDataSource<Inspection>();
  isLoading = true;
  isRefreshing = false;

  // ===== DATA PROPERTIES =====
  typesInspection: TypeInspection[] = [];
  actifs: Actif[] = [];
  utilisateurs: Utilisateur[] = [];
  inspecteurs: Utilisateur[] = [];

  // ===== FILTERING AND PAGINATION =====
  filtres: ComponentFiltres = {};
  totalInspections = 0;
  pageSize = 10;

  // ===== SEARCH DEBOUNCE =====
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // ===== STATE OPTIONS =====
  etatOptions: EtatInspectionOption[] = [
  { value: 'PROGRAMMEE' as EtatInspection, label: 'Planifiée', color: '#2196f3', icon: 'schedule' },
  { value: 'EN_COURS' as EtatInspection, label: 'En cours', color: '#ff9800', icon: 'play_circle_filled' },
  { value: 'CLOTUREE' as EtatInspection, label: 'Terminée', color: '#9c27b0', icon: 'task_alt' },
  { value: 'VALIDEE' as EtatInspection, label: 'Validée', color: '#4caf50', icon: 'check_circle' },
  { value: 'REJETEE' as EtatInspection, label: 'Rejetée', color: '#f44336', icon: 'cancel' },
  { value: 'ANNULEE' as EtatInspection, label: 'Annulée', color: '#757575', icon: 'block' }
];

  // ===== VIEW CHILDREN =====
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;


  constructor(
    private adminService: AdminService,
    private notificationService: NotificationAdminService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.setupSearchDebounce();
  }

  // ===== LIFECYCLE HOOKS =====
  ngOnInit(): void {
    this.initializeComponent();
    this.loadDropdownData();
  }

  ngAfterViewInit(): void {
  console.log('🚀 Initializing table...');
  
  if (this.paginator) {
    this.dataSource.paginator = this.paginator;
    console.log('📄 Paginator connected');
  }
  
  if (this.sort) {
    this.dataSource.sort = this.sort;
    console.log('🔀 Sort connected');
  }
  
  // Load data after a short delay to ensure everything is initialized
  setTimeout(() => {
    this.loadInspections();
  }, 100);
  
  this.setupTableEvents();
}

  ngOnDestroy(): void {
    this.cleanupComponent();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== INITIALIZATION METHODS =====
  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.filtres.search = searchTerm;
      this.applyFilters();
    });
  }

  private setupTableEvents(): void {
    if (this.sort) {
      this.sort.sortChange.pipe(takeUntil(this.destroy$)).subscribe(() => {
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
        this.loadInspections();
      });
    }

    if (this.paginator) {
      this.paginator.page.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.loadInspections();
      });
    }
  }

  private loadDropdownData(): void {
    // Load types with error handling
    this.adminService.getTypesInspection().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => this.typesInspection = data,
      error: (error) => {
        console.error('Error loading inspection types:', error);
        this.notificationService.showError('Erreur lors du chargement des types d\'inspection');
      }
    });

    // Load actifs with error handling
    this.adminService.getActifs().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => this.actifs = response.data,
      error: (error) => {
        console.error('Error loading actifs:', error);
        this.notificationService.showError('Erreur lors du chargement des actifs');
      }
    });

    // Load users with error handling
    this.adminService.getUtilisateurs().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        this.utilisateurs = Array.isArray(response) ? response : (response?.data || []);
        this.inspecteurs = this.utilisateurs.filter(u =>
          u.role === 'inspecteur' || u.role === 'admin'
        );
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.notificationService.showError('Erreur lors du chargement des utilisateurs');
      }
    });
  }

  // ===== COMPONENT LIFECYCLE HELPERS =====
  private initializeComponent(): void {
    this.loadUserPreferences();
    this.setupKeyboardShortcuts();
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  private cleanupComponent(): void {
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    this.saveUserPreferences();
  }

  // ===== DATA LOADING METHODS =====
loadInspections(): void {
  this.isLoading = true;

  const currentFiltres: any = {
    page: (this.paginator?.pageIndex || 0) + 1,
    limit: this.paginator?.pageSize || this.pageSize,
    sortBy: this.sort?.active || 'id',
    sortOrder: this.sort?.direction?.toUpperCase() || 'DESC'
  };

  // Only add filters that have actual values
  if (this.filtres.search?.trim()) {
    currentFiltres.search = this.filtres.search.trim();
  }
  if (this.filtres.idType) {
    currentFiltres.idType = this.filtres.idType;
  }
  if (this.filtres.etat) {
    currentFiltres.etat = this.filtres.etat;
  }

  console.log('Sending filters:', currentFiltres);

  this.adminService.getInspections(currentFiltres).pipe(
    takeUntil(this.destroy$)
  ).subscribe({
    next: (response) => {
      this.dataSource.data = response.data || [];
      this.totalInspections = response.total || 0;
      this.isLoading = false;
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('Load failed, using emergency fallback');
      this.loadInspectionsSimple();
    }
  });
}

  refreshData(): void {
    this.isRefreshing = true;
    this.loadInspections();
  }

  // ===== DIALOG METHODS =====
  openAddDialog(): void {
    this.openInspectionDialog(false);
  }

  openEditDialog(inspection: Inspection): void {
    this.openInspectionDialog(true, inspection);
  }

  private openInspectionDialog(isEditMode: boolean, inspection?: Inspection): void {
    const dialogData: InspectionDialogData = {
      isEditMode,
      inspection,
      typesInspection: this.typesInspection,
      actifs: this.actifs,
      inspecteurs: this.inspecteurs
    };

    const dialogRef = this.dialog.open(InspectionDialogComponent, {
      width: 'clamp(500px, 60vw, 900px)',
      maxHeight: '90vh',
      autoFocus: 'first-tabbable',
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (!result) return;

      // Process form data
      const finalActifIds = Array.isArray(result.actifIds)
        ? result.actifIds.map((id: string | number) => Number(id))
        : [];

      const formData = { ...result, actifIds: finalActifIds };

      const action = isEditMode && inspection
        ? this.adminService.updateInspection(inspection.id, formData)
        : this.adminService.createInspection(formData);

      action.pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          const message = isEditMode ? 'Inspection modifiée avec succès' : 'Inspection créée avec succès';
          this.notificationService.showSuccess(message);
          this.loadInspections();
        },
        error: (error) => {
          console.error('Error saving inspection:', error);
          const message = isEditMode ? 'Erreur lors de la modification' : 'Erreur lors de la création';
          this.notificationService.showError(message);
        }
      });
    });
  }

  // ===== ACTION METHODS =====
  deleteInspection(inspection: Inspection): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Supprimer l\'inspection',
        message: `Êtes-vous sûr de vouloir supprimer l'inspection "${inspection.titre}" ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
      if (confirmed) {
        this.adminService.deleteInspection(inspection.id).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.notificationService.showSuccess('Inspection supprimée avec succès');
            this.loadInspections();
          },
          error: (error) => {
            console.error('Error deleting inspection:', error);
            this.notificationService.showError('Erreur lors de la suppression');
          }
        });
      }
    });
  }

  duplicateInspection(inspection: Inspection): void {
    if (!inspection.typeInspection?.id) {
      this.notificationService.showError("Impossible de dupliquer : le type d'inspection est manquant");
      return;
    }

    const newInspectionData: CreateInspectionDto = {
      titre: `${inspection.titre} (Copie)`,
      idType: inspection.typeInspection.id,
      dateDebut: new Date(),
      dateFin: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      actifIds: inspection.actifs?.map(a => a.id) || [],
      idInspecteur: inspection.createur?.id
    };

    this.adminService.createInspection(newInspectionData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.notificationService.showSuccess('Inspection dupliquée avec succès');
        this.loadInspections();
      },
      error: (error) => {
        console.error('Error duplicating inspection:', error);
        this.notificationService.showError('Erreur lors de la duplication');
      }
    });
  }

  viewInspectionDetails(inspection: Inspection): void {
    // TODO: Implement inspection details view
    console.log('View details for inspection:', inspection);
    this.notificationService.showInfo('Fonctionnalité en cours de développement');
  }

  exportInspection(inspection: Inspection): void {
    // TODO: Implement single inspection export
    console.log('Export inspection:', inspection);
    this.notificationService.showInfo('Export en cours de développement');
  }

  exportInspections(): void {
    // TODO: Implement bulk export
    console.log('Export all inspections with filters:', this.filtres);
    this.notificationService.showInfo('Export en cours de développement');
  }

  showActifsDetails(actifs: Actif[], event: Event): void {
    event.stopPropagation();
    // TODO: Implement actifs details popup
    console.log('Show actifs details:', actifs);
    this.notificationService.showInfo('Détails des actifs - en cours de développement');
  }

  // ===== FILTERING METHODS =====
  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  applyFilters(): void {
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadInspections();
  }

  clearFilters(): void {
  this.filtres = {};
  if (this.paginator) {
    this.paginator.pageIndex = 0;
  }
  console.log('🧹 Filters cleared, reloading...');
  this.loadInspections();
}

  hasActiveFilters(): boolean {
    return Object.keys(this.filtres).some(key => {
      const value = (this.filtres as any)[key];
      return value !== undefined && value !== null && value !== '';
    });
  }

  getActiveFiltersCount(): number {
    return Object.keys(this.filtres).filter(key => {
      const value = (this.filtres as any)[key];
      return value !== undefined && value !== null && value !== '';
    }).length;
  }

  getActiveFiltersText(): string {
    const activeFilters: string[] = [];

    if (this.filtres.search) {
      activeFilters.push(`Recherche: "${this.filtres.search}"`);
    }

    if (this.filtres.idType) {
      const type = this.typesInspection.find(t => t.id === this.filtres.idType);
      activeFilters.push(`Type: ${type?.nom || 'Inconnu'}`);
    }

    if (this.filtres.etat) {
      const etat = this.etatOptions.find(e => e.value === this.filtres.etat);
      activeFilters.push(`État: ${etat?.label || 'Inconnu'}`);
    }

    if (this.filtres.dateDebutMin) {
      activeFilters.push(`Début après: ${new Date(this.filtres.dateDebutMin).toLocaleDateString()}`);
    }

    if (this.filtres.dateDebutMax) {
      activeFilters.push(`Début avant: ${new Date(this.filtres.dateDebutMax).toLocaleDateString()}`);
    }

    return activeFilters.join(', ');
  }

  // ===== TABLE MANAGEMENT =====
  updateDisplayedColumns(): void {
    // Always include actions column
    const columns = this.visibleColumns.filter(col => col !== 'actions');
    this.displayedColumns = [...columns, 'actions'];
  }

  isRowHighlighted(row: Inspection): boolean {
  const today = new Date();
  const startDate = new Date(row.dateDebut);
  const endDate = new Date(row.dateFin);

  // Use enum values instead of French strings
  return row.etat === EtatInspection.EN_COURS ||
         (startDate <= today && endDate >= today && row.etat === EtatInspection.PROGRAMMEE);
}
  // ===== KEYBOARD SHORTCUTS =====
  onKeyDown(event: KeyboardEvent): void {
    // Ctrl/Cmd + N for new inspection
    if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
      event.preventDefault();
      this.openAddDialog();
    }

    // Ctrl/Cmd + R for refresh
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
      event.preventDefault();
      this.refreshData();
    }

    // Escape to clear filters
    if (event.key === 'Escape' && this.hasActiveFilters()) {
      this.clearFilters();
    }
  }

  // ===== LOCAL STORAGE FOR USER PREFERENCES =====
  saveUserPreferences(): void {
    const preferences = {
      pageSize: this.pageSize,
      visibleColumns: this.visibleColumns,
      sortBy: this.sort?.active,
      sortDirection: this.sort?.direction
    };

    localStorage.setItem('inspection-preferences', JSON.stringify(preferences));
  }

  loadUserPreferences(): void {
    try {
      const saved = localStorage.getItem('inspection-preferences');
      if (saved) {
        const preferences = JSON.parse(saved);

        if (preferences.pageSize) {
          this.pageSize = preferences.pageSize;
        }

        if (preferences.visibleColumns) {
          this.visibleColumns = preferences.visibleColumns;
          this.updateDisplayedColumns();
        }
      }
    } catch (error) {
      console.warn('Could not load user preferences:', error);
    }
  }

  // ===== UTILITY METHODS =====
  getEtatOption(etatValue: EtatInspection): EtatInspectionOption {
  return this.etatOptions.find(opt => opt.value === etatValue) || {
    value: EtatInspection.ANNULEE,
    label: 'Inconnu',
    color: '#888',
    icon: 'help'
  };
}

  getTypeNom(type?: TypeInspection): string {
    return type?.nom || 'Type non défini';
  }

  getInspecteurNom(inspecteur?: Utilisateur): string {
    if (!inspecteur) return 'Non assigné';
    return inspecteur.nom.trim();
  }

  getStatsByEtat(etat: EtatInspection): number {
    return this.dataSource.data.filter(inspection => inspection.etat === etat).length;
  }

  getDuration(dateDebut: string | Date, dateFin: string | Date): string {
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return '1 jour';
    if (diffDays < 7) return `${diffDays} jours`;
    if (diffDays < 30) return `${Math.round(diffDays / 7)} semaine(s)`;
    return `${Math.round(diffDays / 30)} mois`;
  }

  // ===== TR
  // ACKBY FUNCTIONS FOR PERFORMANCE =====
  trackByEtat = (index: number, item: EtatInspectionOption): string => item.value;

  trackByTypeId = (index: number, item: TypeInspection): string => item.id;

  trackByEtatValue = (index: number, item: EtatInspectionOption): string => item.value;

  trackByInspectionId = (index: number, item: Inspection): string => item.id;

  trackByColumnKey = (index: number, item: TableColumn): string => item.key;

  // ===== MATH UTILITIES FOR TEMPLATE =====
  Math = Math;
  loadInspectionsSimple(): void {
  console.log('🆘 Using emergency simple load...');
  this.isLoading = true;
  
  // Direct HTTP call bypassing complex filtering
  this.adminService.getInspections({}).pipe(
    takeUntil(this.destroy$)
  ).subscribe({
    next: (response) => {
      console.log('🆘 Emergency response:', response);
      this.dataSource.data = response.data || [];
      this.totalInspections = response.total || 0;
      this.isLoading = false;
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('🆘 Emergency load failed:', error);
      this.isLoading = false;
      this.notificationService.showError('Impossible de charger les inspections');
    }
  });
}
debugDataSource(): void {
  console.log('🐛 DataSource debug info:');
  console.log('- Data array:', this.dataSource.data);
  console.log('- Data length:', this.dataSource.data.length);
  console.log('- Total inspections:', this.totalInspections);
  console.log('- Is loading:', this.isLoading);
  console.log('- Current filters:', this.filtres);
  console.log('- Paginator:', this.paginator);
  console.log('- Sort:', this.sort);
}
}