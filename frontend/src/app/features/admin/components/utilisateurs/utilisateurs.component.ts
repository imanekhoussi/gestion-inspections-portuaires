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
import { MatChipsModule } from '@angular/material/chips';

import { AdminService } from '../../services/admin.service';
import { NotificationAdminService } from '../../services/notification-admin.service';
import { Utilisateur, CreateUtilisateurDto } from '../../../../core/models/admin.interfaces';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-utilisateurs',
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
    MatChipsModule
  ],
  templateUrl: './utilisateurs.component.html',
  styleUrls: ['./utilisateurs.component.scss']
})
export class UtilisateursComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['nom', 'email', 'role', 'telephone', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<Utilisateur>();
  isLoading = true;
  
  userForm!: FormGroup;
  isEditMode = false;
  selectedUser: Utilisateur | null = null;
  showForm = false;

  roles = [
    { value: 'admin', label: 'Administrateur' },
    { value: 'inspecteur', label: 'Inspecteur' },
    { value: 'viewer', label: 'Visualiseur' }
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
    this.loadUtilisateurs();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['inspecteur', Validators.required],
      telephone: ['', [Validators.pattern(/^[0-9\+\-\s\(\)]*$/)]]
    });
  }

  loadUtilisateurs(): void {
    this.isLoading = true;
    this.adminService.getUtilisateurs().subscribe({
      next: (users) => {
        this.dataSource.data = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        this.notificationService.showError('Erreur lors du chargement des utilisateurs');
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
    this.selectedUser = null;
    this.showForm = true;
    this.userForm.reset();
    this.userForm.patchValue({ role: 'inspecteur' });
  }

  openEditForm(user: Utilisateur): void {
    this.isEditMode = true;
    this.selectedUser = user;
    this.showForm = true;
    this.userForm.patchValue({
      nom: user.nom,
      email: user.email,
      role: user.role,
      telephone: user.telephone || ''
    });
    // Rendre le mot de passe optionnel en mode édition
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.selectedUser = null;
    this.userForm.reset();
    this.initForm(); // Réinitialiser les validateurs
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const formData: CreateUtilisateurDto = this.userForm.value;
      
      if (this.isEditMode && this.selectedUser) {
        // En mode édition, ne pas envoyer le mot de passe s'il est vide
        if (!formData.password) {
  delete (formData as any).password;
}
        
        this.adminService.updateUtilisateur(this.selectedUser.id, formData).subscribe({
          next: () => {
            this.notificationService.showSuccess('Utilisateur modifié avec succès');
            this.loadUtilisateurs();
            this.closeForm();
          },
          error: (error) => {
            console.error('Erreur lors de la modification:', error);
            this.notificationService.showError('Erreur lors de la modification de l\'utilisateur');
          }
        });
      } else {
        this.adminService.createUtilisateur(formData).subscribe({
          next: () => {
            this.notificationService.showSuccess('Utilisateur créé avec succès');
            this.loadUtilisateurs();
            this.closeForm();
          },
          error: (error) => {
            console.error('Erreur lors de la création:', error);
            this.notificationService.showError('Erreur lors de la création de l\'utilisateur');
          }
        });
      }
    }
  }

  deleteUser(user: Utilisateur): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer l\'utilisateur',
        message: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.nom}" ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.deleteUtilisateur(user.id).subscribe({
          next: () => {
            this.notificationService.showSuccess('Utilisateur supprimé avec succès');
            this.loadUtilisateurs();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            this.notificationService.showError('Erreur lors de la suppression de l\'utilisateur');
          }
        });
      }
    });
  }

  getRoleLabel(role: string): string {
    const roleObj = this.roles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  }

  getRoleClass(role: string): string {
    switch (role) {
      case 'admin': return 'role-admin';
      case 'inspecteur': return 'role-inspecteur';
      case 'viewer': return 'role-viewer';
      default: return '';
    }
  }

  getErrorMessage(field: string): string {
    const control = this.userForm.get(field);
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(field)} est requis`;
    }
    if (control?.hasError('email')) {
      return 'Email invalide';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `Minimum ${minLength} caractères requis`;
    }
    if (control?.hasError('pattern')) {
      return 'Format invalide';
    }
    return '';
  }

  private getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      nom: 'Nom',
      email: 'Email',
      password: 'Mot de passe',
      role: 'Rôle',
      telephone: 'Téléphone'
    };
    return labels[field] || field;
  }
}