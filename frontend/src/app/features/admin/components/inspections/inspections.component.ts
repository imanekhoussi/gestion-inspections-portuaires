// src/app/features/admin/components/inspections/inspections.component.ts

import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { AdminService } from '../../services/admin.service';
import { NotificationAdminService } from '../../services/notification-admin.service';
import { 
  Inspection, TypeInspection, Actif, Groupe, EtatInspection,
  CreateInspectionDto, UpdateInspectionDto,
  FiltresInspections
} from '../../../../core/models/admin.interfaces';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { InspectionDialogComponent, InspectionDialogData } from './inspection-dialog/inspection-dialog.component';

interface EtatInspectionOption {
  value: EtatInspection;
  label: string;
  description: string;
  color: string;
  icon: string;
  nextStates?: EtatInspection[];
}

@Component({
  selector: 'app-inspections',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatSnackBarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatCheckboxModule
  ],
  templateUrl: './inspections.component.html',
  styleUrls: ['./inspections.component.scss']
})
export class InspectionsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['titre', 'type', 'periode', 'etat', 'actifs', 'actions'];
  dataSource = new MatTableDataSource<Inspection>();
  isLoading = true;
  
  // Data for dropdowns and dialogs
  typesInspection: TypeInspection[] = [];
  actifs: Actif[] = [];
  groupes: Groupe[] = []; 

  // Filters
  filtres: FiltresInspections = {};

  // State configuration
  etatOptions: EtatInspectionOption[] = [
    { value: 'Planifiée', label: 'Planifiée', description: 'Inspection programmée', color: '#2196f3', icon: 'schedule', nextStates: ['En cours', 'Annulée'] },
    { value: 'En cours', label: 'En cours', description: 'Inspection en cours d\'exécution', color: '#ff9800', icon: 'play_circle_filled', nextStates: ['Terminée', 'Annulée'] },
    { value: 'Terminée', label: 'Terminée', description: 'Inspection terminée en attente de validation', color: '#9c27b0', icon: 'task_alt', nextStates: ['Validée', 'Rejetée'] },
    { value: 'Validée', label: 'Validée', description: 'Inspection validée et conforme', color: '#4caf50', icon: 'check_circle', nextStates: [] },
    { value: 'Rejetée', label: 'Rejetée', description: 'Inspection rejetée pour corrections', color: '#f44336', icon: 'cancel', nextStates: ['En cours'] },
    { value: 'Annulée', label: 'Annulée', description: 'Inspection annulée', color: '#757575', icon: 'block', nextStates: [] }
  ];

  totalInspections = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationAdminService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.sort.sortChange.subscribe(() => {
      this.paginator.pageIndex = 0;
      this.loadInspections();
    });

    this.paginator.page.subscribe(() => {
      this.loadInspections();
    });
  }

  /**
   * Loads all necessary data for the component.
   */
  private loadData(): void {
    this.isLoading = true;
    Promise.all([
      this.loadTypesInspection(),
      this.loadActifs(),
      this.loadGroupes(), 
      this.loadInspections()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  private loadTypesInspection(): Promise<void> {
    return new Promise((resolve) => {
      this.adminService.getTypesInspection().subscribe({
        next: (types) => { this.typesInspection = types; resolve(); },
        error: (err) => { console.error(err); resolve(); }
      });
    });
  }

  private loadActifs(): Promise<void> {
  return new Promise((resolve) => {
    console.log('=== LOADING ACTIFS ===');
    this.adminService.getActifs({ limit: 1000 }).subscribe({
      next: (response) => { 
        console.log('Actifs API response:', response);
        console.log('Actifs data:', response.data);
        console.log('Actifs count:', response.data?.length || 0);
        this.actifs = response.data; 
        resolve(); 
      },
      error: (err) => { 
        console.error('Error loading actifs:', err); 
        resolve(); 
      }
    });
  });
}

  /**
   * Fetches the list of asset groups.
   */
  private loadGroupes(): Promise<void> {
    return new Promise((resolve) => {
      this.adminService.getGroupes().subscribe({
        next: (groupes) => { this.groupes = groupes; resolve(); },
        error: (err) => { console.error('Erreur chargement groupes:', err); resolve(); }
      });
    });
  }

  /**
   * Loads inspections based on current filters, sorting, and pagination.
   */
  loadInspections(): void {
    this.isLoading = true;
    const currentFiltres: FiltresInspections = {
      ...this.filtres,
      page: this.paginator ? this.paginator.pageIndex + 1 : 1,
      limit: this.paginator ? this.paginator.pageSize : 10,
      sortBy: this.sort ? this.sort.active : 'dateDebut',
      sortOrder: this.sort ? (this.sort.direction as 'asc' | 'desc') : 'desc',
    };

    this.adminService.getInspections(currentFiltres).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalInspections = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.showError('Erreur lors du chargement des inspections.');
        this.isLoading = false;
      }
    });
  }

  /**
   * Opens the inspection dialog for creation or editing.
   * Passes all necessary data including the list of groups.
   */
  openInspectionDialog(inspection?: Inspection): void {
    console.log('=== OPENING DIALOG ===');
  console.log('Types inspection count:', this.typesInspection.length);
  console.log('Actifs count:', this.actifs.length);
  console.log('Groupes count:', this.groupes.length);
  
  if (!this.typesInspection.length || !this.actifs.length || !this.groupes.length) {
    this.notificationService.showError('Les données ne sont pas encore chargées. Veuillez patienter.');
    return;
  }
    const dialogRef = this.dialog.open<InspectionDialogComponent, InspectionDialogData>(InspectionDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        inspection: inspection,
        typesInspection: this.typesInspection,
        actifs: this.actifs,
        groupes: this.groupes // Pass groups to the dialog
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (inspection && inspection.id) {
          this.adminService.updateInspection(inspection.id, result).subscribe({
            next: () => {
              this.notificationService.showSuccess('Inspection modifiée avec succès');
              this.loadInspections();
            },
            error: (err) => this.notificationService.showError('Erreur lors de la modification.')
          });
        } else {
          this.adminService.createInspection(result).subscribe({
            next: () => {
              this.notificationService.showSuccess('Inspection créée avec succès');
              this.loadInspections();
            },
            error: (err) => this.notificationService.showError('Erreur lors de la création.')
          });
        }
      }
    });
  }

  // Other methods (delete, duplicate, getters, filters) remain the same...

  deleteInspection(inspection: Inspection): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Supprimer l\'inspection',
        message: `Êtes-vous sûr de vouloir supprimer l'inspection "${inspection.titre}" ?`,
        confirmText: 'Supprimer',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.adminService.deleteInspection(inspection.id).subscribe({
          next: () => {
            this.notificationService.showSuccess('Inspection supprimée');
            this.loadInspections();
          },
          error: (err) => this.notificationService.showError('Erreur lors de la suppression.')
        });
      }
    });
  }

  duplicateInspection(inspection: Inspection): void {
    const newInspection: CreateInspectionDto = {
      titre: `${inspection.titre} (Copie)`,
      idType: inspection.idType,
      dateDebut: new Date(),
      dateFin: new Date(Date.now() + 24 * 60 * 60 * 1000),
      actifIds: inspection.actifIds,
      commentaire: inspection.commentaire
    };

    this.adminService.createInspection(newInspection).subscribe({
      next: () => {
        this.notificationService.showSuccess('Inspection dupliquée');
        this.loadInspections();
      },
      error: (err) => this.notificationService.showError('Erreur lors de la duplication.')
    });
  }

  getEtatOption(etat: EtatInspection): EtatInspectionOption {
    return this.etatOptions.find(option => option.value === etat) || this.etatOptions[0];
  }

  getTypeNom(idType: string): string {
    const type = this.typesInspection.find(t => t.id === idType);
    return type ? type.nom : 'N/A';
  }

  getActifsNoms(actifIds: string[]): string[] {
    if (!actifIds) return [];
    return actifIds.map(id => {
      const actif = this.actifs.find(a => a.id === id);
      return actif ? actif.nom : 'Actif inconnu';
    });
  }

  isInspectionEnRetard(inspection: Inspection): boolean {
    const today = new Date();
    const dateFin = new Date(inspection.dateFin);
    return dateFin < today && ['Planifiée', 'En cours'].includes(inspection.etat);
  }

  applyFilters(): void {
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadInspections();
  }

  clearFilters(): void {
    this.filtres = {};
    this.applyFilters();
  }
}
