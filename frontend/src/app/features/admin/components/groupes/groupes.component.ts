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

import { AdminService } from '../../services/admin.service';
import { NotificationAdminService } from '../../services/notification-admin.service';
import { Groupe, Famille, CreateGroupeDto } from '../../../../core/models/admin.interfaces';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-groupes',
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
    MatChipsModule
  ],
  templateUrl: './groupes.component.html',
  styleUrls: ['./groupes.component.scss']
})
export class GroupesComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['nom', 'code', 'famille', 'nbActifs', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<Groupe>();
  isLoading = true;
  
  groupeForm!: FormGroup;
  isEditMode = false;
  selectedGroupe: Groupe | null = null;
  showForm = false;

  // Données pour les dropdowns
  familles: Famille[] = [];
  famillesLoading = false;

  // Filtres
  selectedFamilleFilter: string = '';

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
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private initForm(): void {
    this.groupeForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10), Validators.pattern(/^[A-Z0-9_-]+$/)]],
      idFamille: ['', Validators.required]
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
        this.notificationService.showError('Erreur lors du chargement des familles');
        this.famillesLoading = false;
      }
    });
  }

  loadGroupes(): void {
    this.isLoading = true;
    this.adminService.getGroupes().subscribe({
      next: (groupes) => {
        this.dataSource.data = groupes;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des groupes:', error);
        this.notificationService.showError('Erreur lors du chargement des groupes');
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

  applyFamilleFilter(): void {
    if (this.selectedFamilleFilter) {
      this.dataSource.data = this.dataSource.data.filter(groupe => 
        groupe.idFamille === this.selectedFamilleFilter
      );
    } else {
      this.loadGroupes(); // Recharger toutes les données
    }
  }

  clearFilters(): void {
    this.selectedFamilleFilter = '';
    this.loadGroupes();
  }

  openCreateForm(): void {
    if (this.familles.length === 0) {
      this.notificationService.showWarning('Vous devez d\'abord créer au moins une famille');
      return;
    }

    this.isEditMode = false;
    this.selectedGroupe = null;
    this.showForm = true;
    this.groupeForm.reset();
  }

  openEditForm(groupe: Groupe): void {
    this.isEditMode = true;
    this.selectedGroupe = groupe;
    this.showForm = true;
    this.groupeForm.patchValue({
      nom: groupe.nom,
      code: groupe.code,
      idFamille: groupe.idFamille
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.selectedGroupe = null;
    this.groupeForm.reset();
  }

  onSubmit(): void {
    if (this.groupeForm.valid) {
      const formData: CreateGroupeDto = this.groupeForm.value;
      
      if (this.isEditMode && this.selectedGroupe) {
        this.adminService.updateGroupe(this.selectedGroupe.id, formData).subscribe({
          next: () => {
            this.notificationService.showSuccess('Groupe modifié avec succès');
            this.loadGroupes();
            this.closeForm();
          },
          error: (error) => {
            console.error('Erreur lors de la modification:', error);
            this.notificationService.showError('Erreur lors de la modification du groupe');
          }
        });
      } else {
        this.adminService.createGroupe(formData).subscribe({
          next: () => {
            this.notificationService.showSuccess('Groupe créé avec succès');
            this.loadGroupes();
            this.closeForm();
          },
          error: (error) => {
            console.error('Erreur lors de la création:', error);
            this.notificationService.showError('Erreur lors de la création du groupe');
          }
        });
      }
    }
  }

  deleteGroupe(groupe: Groupe): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer le groupe',
        message: `Êtes-vous sûr de vouloir supprimer le groupe "${groupe.nom}" ?
        
⚠️ Cette action supprimera également tous les types d'inspection associés.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.deleteGroupe(groupe.id).subscribe({
          next: () => {
            this.notificationService.showSuccess('Groupe supprimé avec succès');
            this.loadGroupes();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            this.notificationService.showError('Erreur lors de la suppression du groupe');
          }
        });
      }
    });
  }

  generateCode(): void {
    const nom = this.groupeForm.get('nom')?.value;
    if (nom) {
      const code = nom
        .toUpperCase()
        .replace(/[ÀÂÄÃÁÇ]/g, 'A')
        .replace(/[ÈÊËÉ]/g, 'E')
        .replace(/[ÎÏÍÌ]/g, 'I')
        .replace(/[ÔÖÓÒÕ]/g, 'O')
        .replace(/[ÛÜÚÙ]/g, 'U')
        .replace(/[^A-Z0-9]/g, '_')
        .substring(0, 8);
      
      this.groupeForm.patchValue({ code });
    }
  }

  getFamilleNom(idFamille: string): string {
    const famille = this.familles.find(f => f.id === idFamille);
    return famille ? famille.nom : 'Famille inconnue';
  }

  getFamilleCode(idFamille: string): string {
    const famille = this.familles.find(f => f.id === idFamille);
    return famille ? famille.code : 'N/A';
  }

  getGroupesByFamille(idFamille: string): number {
    return this.dataSource.data.filter(g => g.idFamille === idFamille).length;
  }

  getErrorMessage(field: string): string {
    const control = this.groupeForm.get(field);
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(field)} est requis`;
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `Minimum ${minLength} caractères requis`;
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength']?.requiredLength;
      return `Maximum ${maxLength} caractères autorisés`;
    }
    if (control?.hasError('pattern')) {
      return 'Code invalide (A-Z, 0-9, _, - uniquement)';
    }
    return '';
  }

  private getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      nom: 'Nom',
      code: 'Code',
      idFamille: 'Famille'
    };
    return labels[field] || field;
  }
}