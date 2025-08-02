// src/app/features/admin/components/inspections/inspections.component.ts

import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormsModule } from '@angular/forms';
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
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { AdminService } from '../../services/admin.service';
import { NotificationAdminService } from '../../services/notification-admin.service';
import { 
  Inspection, TypeInspection, Actif, Utilisateur, EtatInspection,
  CreateInspectionDto, UpdateInspectionDto, UpdateEtatInspectionDto,
  FiltresInspections, PaginatedResponse
} from '../../../../core/models/admin.interfaces';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

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
    ReactiveFormsModule,
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
    MatBadgeModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatStepperModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatCheckboxModule
  ],
  templateUrl: './inspections.component.html',
  styleUrls: ['./inspections.component.scss']
})
export class InspectionsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['titre', 'type', 'periode', 'etat', 'actifs', 'inspecteur', 'actions'];
  dataSource = new MatTableDataSource<Inspection>();
  isLoading = true;
  
  // Formulaires
  inspectionForm!: FormGroup;
  etatForm!: FormGroup;
  isEditMode = false;
  selectedInspection: Inspection | null = null;
  showForm = false;
  showEtatDialog = false;

  // Données pour les dropdowns
  typesInspection: TypeInspection[] = [];
  actifs: Actif[] = [];
  utilisateurs: Utilisateur[] = [];
  inspecteurs: Utilisateur[] = [];
  typesLoading = false;
  actifsLoading = false;
  utilisateursLoading = false;

  // Filtres
  filtres: FiltresInspections = {
    page: 1,
    limit: 10
  };

  // Configuration des états
  etatOptions: EtatInspectionOption[] = [
    {
      value: 'Planifiée',
      label: 'Planifiée',
      description: 'Inspection programmée',
      color: '#2196f3',
      icon: 'schedule',
      nextStates: ['En cours', 'Annulée']
    },
    {
      value: 'En cours',
      label: 'En cours',
      description: 'Inspection en cours d\'exécution',
      color: '#ff9800',
      icon: 'play_circle_filled',
      nextStates: ['Terminée', 'Annulée']
    },
    {
      value: 'Terminée',
      label: 'Terminée',
      description: 'Inspection terminée en attente de validation',
      color: '#9c27b0',
      icon: 'task_alt',
      nextStates: ['Validée', 'Rejetée']
    },
    {
      value: 'Validée',
      label: 'Validée',
      description: 'Inspection validée et conforme',
      color: '#4caf50',
      icon: 'check_circle',
      nextStates: []
    },
    {
      value: 'Rejetée',
      label: 'Rejetée',
      description: 'Inspection rejetée pour corrections',
      color: '#f44336',
      icon: 'cancel',
      nextStates: ['En cours']
    },
    {
      value: 'Annulée',
      label: 'Annulée',
      description: 'Inspection annulée',
      color: '#757575',
      icon: 'block',
      nextStates: []
    }
  ];

  // Pagination
  totalInspections = 0;
  pageSize = 10;
  currentPage = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationAdminService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Gestion de la pagination
    this.paginator.page.subscribe(() => {
      this.filtres.page = this.paginator.pageIndex + 1;
      this.filtres.limit = this.paginator.pageSize;
      this.loadInspections();
    });

    // Gestion du tri
    this.sort.sortChange.subscribe(() => {
      this.filtres.sortBy = this.sort.active;
      this.filtres.sortOrder = this.sort.direction as 'asc' | 'desc';
      this.loadInspections();
    });
  }

  private initForms(): void {
    this.inspectionForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      idType: ['', Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      idInspecteur: [''],
      actifIds: [[], Validators.required],
      commentaire: ['']
    });

    this.etatForm = this.fb.group({
      etat: ['', Validators.required],
      commentaire: ['']
    });
  }

  private loadData(): void {
    Promise.all([
      this.loadTypesInspection(),
      this.loadActifs(),
      this.loadUtilisateurs(),
      this.loadInspections()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  private loadTypesInspection(): Promise<void> {
    this.typesLoading = true;
    return new Promise((resolve) => {
      this.adminService.getTypesInspection().subscribe({
        next: (types) => {
          this.typesInspection = types;
          this.typesLoading = false;
          resolve();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des types:', error);
          this.typesLoading = false;
          resolve();
        }
      });
    });
  }

  private loadActifs(): Promise<void> {
    this.actifsLoading = true;
    return new Promise((resolve) => {
      this.adminService.getActifs().subscribe({
        next: (response) => {
          this.actifs = response.data;
          this.actifsLoading = false;
          resolve();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des actifs:', error);
          this.actifsLoading = false;
          resolve();
        }
      });
    });
  }

  private loadUtilisateurs(): Promise<void> {
    this.utilisateursLoading = true;
    return new Promise((resolve) => {
      this.adminService.getUtilisateurs().subscribe({
        next: (response: any) => {
          this.utilisateurs = Array.isArray(response) ? response : (response?.data || []);
          this.inspecteurs = this.utilisateurs.filter((u: Utilisateur) => 
            u.role === 'inspecteur' || u.role === 'admin'
          );
          this.utilisateursLoading = false;
          resolve();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des utilisateurs:', error);
          this.utilisateursLoading = false;
          resolve();
        }
      });
    });
  }

  loadInspections(): void {
    this.adminService.getInspections(this.filtres).subscribe({
      next: (response: PaginatedResponse<Inspection>) => {
        this.dataSource.data = response.data;
        this.totalInspections = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des inspections:', error);
        this.notificationService.showError('Erreur lors du chargement des inspections');
        this.isLoading = false;
      }
    });
  }

  // ===== GESTION DU FORMULAIRE =====

  openCreateForm(): void {
    if (this.typesInspection.length === 0) {
      this.notificationService.showWarning('Vous devez d\'abord créer au moins un type d\'inspection');
      return;
    }

    if (this.actifs.length === 0) {
      this.notificationService.showWarning('Aucun actif disponible pour créer une inspection');
      return;
    }

    this.isEditMode = false;
    this.selectedInspection = null;
    this.showForm = true;
    this.inspectionForm.reset();
    
    // Dates par défaut
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    this.inspectionForm.patchValue({
      dateDebut: today,
      dateFin: tomorrow,
      actifIds: []
    });
  }

  openEditForm(inspection: Inspection): void {
    this.isEditMode = true;
    this.selectedInspection = inspection;
    this.showForm = true;
    
    this.inspectionForm.patchValue({
      titre: inspection.titre,
      idType: inspection.idType,
      dateDebut: new Date(inspection.dateDebut),
      dateFin: new Date(inspection.dateFin),
      idInspecteur: inspection.idInspecteur || '',
      actifIds: inspection.actifIds || [],
      commentaire: inspection.commentaire || ''
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.selectedInspection = null;
    this.inspectionForm.reset();
  }

  onSubmit(): void {
    if (this.inspectionForm.valid) {
      const formData: CreateInspectionDto = {
        ...this.inspectionForm.value,
        dateDebut: new Date(this.inspectionForm.value.dateDebut),
        dateFin: new Date(this.inspectionForm.value.dateFin)
      };
      
      if (this.isEditMode && this.selectedInspection) {
        this.adminService.updateInspection(this.selectedInspection.id, formData).subscribe({
          next: () => {
            this.notificationService.showSuccess('Inspection modifiée avec succès');
            this.loadInspections();
            this.closeForm();
          },
          error: (error) => {
            console.error('Erreur lors de la modification:', error);
            this.notificationService.showError('Erreur lors de la modification de l\'inspection');
          }
        });
      } else {
        this.adminService.createInspection(formData).subscribe({
          next: () => {
            this.notificationService.showSuccess('Inspection créée avec succès');
            this.loadInspections();
            this.closeForm();
          },
          error: (error) => {
            console.error('Erreur lors de la création:', error);
            this.notificationService.showError('Erreur lors de la création de l\'inspection');
          }
        });
      }
    }
  }

  // ===== GESTION DES ACTIFS =====

  onActifToggle(actifId: string, checked: boolean): void {
    const currentActifIds = this.inspectionForm.get('actifIds')?.value || [];
    
    if (checked) {
      // Ajouter l'actif s'il n'est pas déjà présent
      if (!currentActifIds.includes(actifId)) {
        const newActifIds = [...currentActifIds, actifId];
        this.inspectionForm.patchValue({ actifIds: newActifIds });
      }
    } else {
      // Retirer l'actif
      const newActifIds = currentActifIds.filter((id: string) => id !== actifId);
      this.inspectionForm.patchValue({ actifIds: newActifIds });
    }
    
    // Déclencher la validation
    this.inspectionForm.get('actifIds')?.updateValueAndValidity();
  }

  // ===== GESTION DES ÉTATS =====

  openEtatDialog(inspection: Inspection): void {
    this.selectedInspection = inspection;
    this.showEtatDialog = true;
    
    this.etatForm.patchValue({
      etat: inspection.etat,
      commentaire: ''
    });
  }

  closeEtatDialog(): void {
    this.showEtatDialog = false;
    this.selectedInspection = null;
    this.etatForm.reset();
  }

  onEtatSubmit(): void {
    if (this.etatForm.valid && this.selectedInspection) {
      const etatData: UpdateEtatInspectionDto = this.etatForm.value;
      
      this.adminService.updateEtatInspection(this.selectedInspection.id, etatData).subscribe({
        next: () => {
          this.notificationService.showStatusChange(
            'Inspection',
            this.selectedInspection!.etat,
            etatData.etat
          );
          this.loadInspections();
          this.closeEtatDialog();
        },
        error: (error) => {
          console.error('Erreur lors du changement d\'état:', error);
          this.notificationService.showError('Erreur lors du changement d\'état');
        }
      });
    }
  }

  // ===== ACTIONS =====

  deleteInspection(inspection: Inspection): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer l\'inspection',
        message: `Êtes-vous sûr de vouloir supprimer l'inspection "${inspection.titre}" ?
        
⚠️ Cette action est irréversible et supprimera tous les résultats associés.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.deleteInspection(inspection.id).subscribe({
          next: () => {
            this.notificationService.showSuccess('Inspection supprimée avec succès');
            this.loadInspections();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            this.notificationService.showError('Erreur lors de la suppression de l\'inspection');
          }
        });
      }
    });
  }

  duplicateInspection(inspection: Inspection): void {
    const newInspection: CreateInspectionDto = {
      titre: `${inspection.titre} (Copie)`,
      idType: inspection.idType,
      dateDebut: new Date(),
      dateFin: new Date(Date.now() + 24 * 60 * 60 * 1000), // +1 jour
      actifIds: inspection.actifIds,
      idInspecteur: inspection.idInspecteur,
      commentaire: inspection.commentaire
    };

    this.adminService.createInspection(newInspection).subscribe({
      next: () => {
        this.notificationService.showSuccess('Inspection dupliquée avec succès');
        this.loadInspections();
      },
      error: (error) => {
        console.error('Erreur lors de la duplication:', error);
        this.notificationService.showError('Erreur lors de la duplication');
      }
    });
  }

  // ===== GETTERS ET UTILITAIRES =====

  getEtatOption(etat: EtatInspection): EtatInspectionOption {
    return this.etatOptions.find(option => option.value === etat) || this.etatOptions[0];
  }

  getNextStates(currentEtat: EtatInspection): EtatInspectionOption[] {
    const currentOption = this.getEtatOption(currentEtat);
    return this.etatOptions.filter(option => 
      currentOption.nextStates?.includes(option.value)
    );
  }

  getTypeNom(idType: string): string {
    const type = this.typesInspection.find(t => t.id === idType);
    return type ? type.nom : 'Type inconnu';
  }

  getInspecteurNom(idInspecteur?: string): string {
    if (!idInspecteur) return 'Non assigné';
    const inspecteur = this.utilisateurs.find(u => u.id === idInspecteur);
    return inspecteur ? inspecteur.nom : 'Inspecteur inconnu';
  }

  getActifsNoms(actifIds: string[]): string[] {
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

  canChangeEtat(inspection: Inspection): boolean {
    return !['Validée', 'Annulée'].includes(inspection.etat);
  }

  // ===== FILTRES =====

  applyFilters(): void {
    this.filtres.page = 1;
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.loadInspections();
  }

  clearFilters(): void {
    this.filtres = { page: 1, limit: 10 };
    this.loadInspections();
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.filtres.search = target.value;
    this.applyFilters();
  }

  // ===== VALIDATION =====

  getErrorMessage(field: string): string {
    const control = this.inspectionForm.get(field);
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(field)} est requis`;
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `Minimum ${minLength} caractères requis`;
    }
    return '';
  }

  private getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      titre: 'Titre',
      idType: 'Type d\'inspection',
      dateDebut: 'Date de début',
      dateFin: 'Date de fin',
      actifIds: 'Actifs'
    };
    return labels[field] || field;
  }

  // ===== STATISTIQUES =====

  getStatsByEtat(): { [key in EtatInspection]: number } {
    const stats = {} as { [key in EtatInspection]: number };
    
    this.etatOptions.forEach(option => {
      stats[option.value] = this.dataSource.data.filter(
        inspection => inspection.etat === option.value
      ).length;
    });
    
    return stats;
  }

  getInspectionsEnRetard(): number {
    return this.dataSource.data.filter(inspection => 
      this.isInspectionEnRetard(inspection)
    ).length;
  }
}