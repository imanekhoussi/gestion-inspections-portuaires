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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

import { AdminService } from '../../services/admin.service';
import { NotificationAdminService } from '../../services/notification-admin.service';
import { Famille, CreateFamilleDto } from '../../../../core/models/admin.interfaces';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-familles',
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
    MatTooltipModule,
    MatBadgeModule
  ],
  templateUrl: './familles.component.html',
  styleUrls: ['./familles.component.scss']
})
export class FamillesComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['nom', 'code', 'nbGroupes', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<Famille>();
  isLoading = true;
  
  familleForm!: FormGroup;
  isEditMode = false;
  selectedFamille: Famille | null = null;
  showForm = false;

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
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private initForm(): void {
    this.familleForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10), Validators.pattern(/^[A-Z0-9_-]+$/)]]
    });
  }

  loadFamilles(): void {
    this.isLoading = true;
    this.adminService.getFamilles().subscribe({
      next: (familles) => {
        this.dataSource.data = familles;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des familles:', error);
        this.notificationService.showError('Erreur lors du chargement des familles');
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

  openCreateForm(): void {
    this.isEditMode = false;
    this.selectedFamille = null;
    this.showForm = true;
    this.familleForm.reset();
  }

  openEditForm(famille: Famille): void {
    this.isEditMode = true;
    this.selectedFamille = famille;
    this.showForm = true;
    this.familleForm.patchValue({
      nom: famille.nom,
      code: famille.code
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.selectedFamille = null;
    this.familleForm.reset();
  }

  onSubmit(): void {
    if (this.familleForm.valid) {
      const formData: CreateFamilleDto = this.familleForm.value;
      
      if (this.isEditMode && this.selectedFamille) {
        this.adminService.updateFamille(this.selectedFamille.id, formData).subscribe({
          next: () => {
            this.notificationService.showSuccess('Famille modifiée avec succès');
            this.loadFamilles();
            this.closeForm();
          },
          error: (error) => {
            console.error('Erreur lors de la modification:', error);
            this.notificationService.showError('Erreur lors de la modification de la famille');
          }
        });
      } else {
        this.adminService.createFamille(formData).subscribe({
          next: () => {
            this.notificationService.showSuccess('Famille créée avec succès');
            this.loadFamilles();
            this.closeForm();
          },
          error: (error) => {
            console.error('Erreur lors de la création:', error);
            this.notificationService.showError('Erreur lors de la création de la famille');
          }
        });
      }
    }
  }

  deleteFamille(famille: Famille): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer la famille',
        message: `Êtes-vous sûr de vouloir supprimer la famille "${famille.nom}" ?
        
⚠️ Cette action supprimera également tous les groupes associés et leurs types d'inspection.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.deleteFamille(famille.id).subscribe({
          next: () => {
            this.notificationService.showSuccess('Famille supprimée avec succès');
            this.loadFamilles();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            this.notificationService.showError('Erreur lors de la suppression de la famille');
          }
        });
      }
    });
  }

  generateCode(): void {
    const nom = this.familleForm.get('nom')?.value;
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
      
      this.familleForm.patchValue({ code });
    }
  }

  getErrorMessage(field: string): string {
    const control = this.familleForm.get(field);
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
      code: 'Code'
    };
    return labels[field] || field;
  }
}