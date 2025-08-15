import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';

import { AdminService } from '../../services/admin.service';
import { NotificationAdminService } from '../../services/notification-admin.service';
import { TypeInspection, Groupe, Famille, CreateTypeInspectionDto } from '../../../../core/models/admin.interfaces';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

interface FrequenceOption {
  value: string;
  label: string;
  description: string;
  color: string;
  icon: string;
}

@Component({
  selector: 'app-types-inspection',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
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
    RouterModule,
    MatProgressSpinnerModule,
    MatExpansionModule
  ],
  templateUrl: './types-inspection.component.html',
  styleUrls: ['./types-inspection.component.scss']
})
export class TypesInspectionComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['nom', 'frequence', 'groupe', 'famille', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<TypeInspection>();
  isLoading = true;
  
  typeForm!: FormGroup;
  isEditMode = false;
  selectedType: TypeInspection | null = null;
  showForm = false;

  // Données pour les dropdowns
  groupes: Groupe[] = [];
  familles: Famille[] = [];
  groupesLoading = false;
  famillesLoading = false;

  // Filtres
  selectedGroupeFilter: string = '';
  selectedFamilleFilter: string = '';
  selectedFrequenceFilter: string = '';

  // Options de fréquence
  frequenceOptions: FrequenceOption[] = [
    {
      value: 'Quotidienne',
      label: 'Journalière',
      description: 'Inspection chaque jour',
      color: '#e74c3c',
      icon: 'today'
    },
    {
      value: 'Hebdomadaire',
      label: 'Hebdomadaire',
      description: 'Inspection chaque semaine',
      color: '#f39c12',
      icon: 'date_range'
    },
    {
      value: 'Mensuelle',
      label: 'Mensuelle',
      description: 'Inspection chaque mois',
      color: '#3498db',
      icon: 'calendar_month'
    },
    {
      value: 'Trimestrielle',
      label: 'Trimestrielle',
      description: 'Inspection tous les 3 mois',
      color: '#9b59b6',
      icon: 'event_repeat'
    },
    {
      value: 'Semestrielle',
      label: 'Semestrielle',
      description: 'Inspection tous les 6 mois',
      color: '#2ecc71',
      icon: 'event_available'
    },
    {
      value: 'Annuelle',
      label: 'Annuelle',
      description: 'Inspection chaque année',
      color: '#34495e',
      icon: 'event_note'
    }
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationAdminService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadFamilles();
    this.loadGroupes();
    this.loadTypesInspection();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private initForm(): void {
    this.typeForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      frequence: ['', Validators.required],
      idGroupe: ['', Validators.required]
    });
  }

  loadFamilles(): void {
    this.famillesLoading = true;
    this.adminService.getFamilles().subscribe({
      next: (familles) => {
        this.familles = familles;
        this.famillesLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des familles:', error);
        this.famillesLoading = false;
      }
    });
  }

  loadGroupes(): void {
    this.groupesLoading = true;
    this.adminService.getGroupes().subscribe({
      next: (groupes) => {
        this.groupes = groupes;
        this.groupesLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des groupes:', error);
        this.notificationService.showError('Erreur lors du chargement des groupes');
        this.groupesLoading = false;
      }
    });
  }

  loadTypesInspection(): void {
    this.isLoading = true;
    this.adminService.getTypesInspection().subscribe({
      next: (types) => {
        this.dataSource.data = types;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des types d\'inspection:', error);
        this.notificationService.showError('Erreur lors du chargement des types d\'inspection');
        this.isLoading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  applyFilters(): void {
    let filteredData = [...this.dataSource.data];

    if (this.selectedFamilleFilter) {
      filteredData = filteredData.filter(type => {
        const groupe = this.getGroupeById(type.idGroupe);
        return groupe?.idFamille === this.selectedFamilleFilter;
      });
    }

    if (this.selectedGroupeFilter) {
      filteredData = filteredData.filter(type => type.idGroupe === this.selectedGroupeFilter);
    }

    if (this.selectedFrequenceFilter) {
      filteredData = filteredData.filter(type => type.frequence === this.selectedFrequenceFilter);
    }

    this.dataSource.data = filteredData;
  }

  clearFilters(): void {
    this.selectedFamilleFilter = '';
    this.selectedGroupeFilter = '';
    this.selectedFrequenceFilter = '';
    this.loadTypesInspection();
  }

  openCreateForm(): void {
    if (this.groupes.length === 0) {
      this.notificationService.showWarning('Vous devez d\'abord créer au moins un groupe');
      return;
    }

    this.isEditMode = false;
    this.selectedType = null;
    this.showForm = true;
    this.typeForm.reset();
  }

  openEditForm(type: TypeInspection): void {
    this.isEditMode = true;
    this.selectedType = type;
    this.showForm = true;
    this.typeForm.patchValue({
      nom: type.nom,
      frequence: type.frequence,
      idGroupe: type.idGroupe
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.selectedType = null;
    this.typeForm.reset();
  }

  onSubmit(): void {
    if (this.typeForm.valid) {
      const formData: CreateTypeInspectionDto = this.typeForm.value;
      
      if (this.isEditMode && this.selectedType) {
        this.adminService.updateTypeInspection(this.selectedType.id, formData).subscribe({
          next: () => {
            this.notificationService.showSuccess('Type d\'inspection modifié avec succès');
            this.loadTypesInspection();
            this.closeForm();
          },
          error: (error) => {
            console.error('Erreur lors de la modification:', error);
            this.notificationService.showError('Erreur lors de la modification du type d\'inspection');
          }
        });
      } else {
        this.adminService.createTypeInspection(formData).subscribe({
          next: () => {
            this.notificationService.showSuccess('Type d\'inspection créé avec succès');
            this.loadTypesInspection();
            this.closeForm();
          },
          error: (error) => {
            console.error('Erreur lors de la création:', error);
            this.notificationService.showError('Erreur lors de la création du type d\'inspection');
          }
        });
      }
    }
  }

  deleteType(type: TypeInspection): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer le type d\'inspection',
        message: `Êtes-vous sûr de vouloir supprimer le type d'inspection "${type.nom}" ?
        
⚠️ Cette action supprimera également toutes les inspections utilisant ce type.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.deleteTypeInspection(type.id).subscribe({
          next: () => {
            this.notificationService.showSuccess('Type d\'inspection supprimé avec succès');
            this.loadTypesInspection();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            this.notificationService.showError('Erreur lors de la suppression du type d\'inspection');
          }
        });
      }
    });
  }

  getGroupeById(id: string): Groupe | undefined {
    return this.groupes.find(g => g.id === id);
  }

  getGroupeNom(idGroupe: string): string {
    const groupe = this.getGroupeById(idGroupe);
    return groupe ? groupe.nom : 'Groupe inconnu';
  }

  getGroupeCode(idGroupe: string): string {
    const groupe = this.getGroupeById(idGroupe);
    return groupe ? groupe.code : 'N/A';
  }

  getFamilleNomByGroupe(idGroupe: string): string {
    const groupe = this.getGroupeById(idGroupe);
    if (groupe) {
      const famille = this.familles.find(f => f.id === groupe.idFamille);
      return famille ? famille.nom : 'Famille inconnue';
    }
    return 'Famille inconnue';
  }

  getFamilleCodeByGroupe(idGroupe: string): string {
    const groupe = this.getGroupeById(idGroupe);
    if (groupe) {
      const famille = this.familles.find(f => f.id === groupe.idFamille);
      return famille ? famille.code : 'N/A';
    }
    return 'N/A';
  }

  getFrequenceOption(frequence: string): FrequenceOption {
    return this.frequenceOptions.find(f => f.value === frequence) || this.frequenceOptions[0];
  }

  getTypesByFrequence(frequence: string): number {
    return this.dataSource.data.filter(t => t.frequence === frequence).length;
  }

  getTypesByGroupe(idGroupe: string): number {
    return this.dataSource.data.filter(t => t.idGroupe === idGroupe).length;
  }

  getGroupesByFamille(idFamille: string): Groupe[] {
    return this.groupes.filter(g => g.idFamille === idFamille);
  }

  getErrorMessage(field: string): string {
    const control = this.typeForm.get(field);
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(field)} est requis`;
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `Minimum ${minLength} caractères requis`;
    }
    return '';
  }

  navigateToInspections(typeId: string): void {
  console.log('Navigate to inspections with type:', typeId);
}
  private getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      nom: 'Nom',
      frequence: 'Fréquence',
      idGroupe: 'Groupe'
    };
    return labels[field] || field;
  }
}