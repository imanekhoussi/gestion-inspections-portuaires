import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { AdminService } from '../../services/admin.service';
import { NotificationAdminService } from '../../services/notification-admin.service';
import { Groupe, Famille } from '../../../../core/models/admin.interfaces';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { GroupeDialogComponent } from './groupe-dialog/groupe-dialog.component';

@Component({
  selector: 'app-groupes',
  standalone: true,
  imports: [
    CommonModule, DatePipe, MatTableModule, MatPaginatorModule, MatSortModule,
    MatDialogModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatTooltipModule, MatBadgeModule, MatChipsModule, FormsModule
  ],
  templateUrl: './groupes.component.html',
  styleUrls: ['./groupes.component.scss']
})
export class GroupesComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['nom', 'code', 'famille', 'nbActifs', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<Groupe>();
  allGroupes: Groupe[] = [];
  isLoading = true;

  familles: Famille[] = [];
  selectedFamilleFilter: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationAdminService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadInitialData(): void {
    this.isLoading = true;
    forkJoin({
      groupes: this.adminService.getGroupes(),
      familles: this.adminService.getFamilles()
    }).subscribe({
      next: ({ groupes, familles }) => {
        this.allGroupes = groupes;
        this.dataSource.data = groupes;
        this.familles = familles;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données initiales:', err);
        this.notificationService.showError('Erreur de chargement des données');
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
    let filteredData = this.allGroupes;
    if (this.selectedFamilleFilter) {
      filteredData = this.allGroupes.filter(g => g.idFamille === this.selectedFamilleFilter);
    }
    this.dataSource.data = filteredData;
  }

  clearFilters(): void {
    this.selectedFamilleFilter = '';
    this.dataSource.data = this.allGroupes;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openGroupeDialog(groupe?: Groupe): void {
    const isEditMode = !!groupe;
    const dialogRef = this.dialog.open(GroupeDialogComponent, {
      width: '500px',
      data: {
        isEditMode,
        groupe: groupe ? {...groupe} : undefined,
        familles: this.familles
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (isEditMode && groupe) {
          this.adminService.updateGroupe(groupe.id, result).subscribe({
            next: () => {
              this.notificationService.showSuccess('Groupe modifié avec succès');
              this.loadInitialData();
            },
            error: err => this.notificationService.showError('Erreur lors de la modification')
          });
        } else {
          this.adminService.createGroupe(result).subscribe({
            next: () => {
              this.notificationService.showSuccess('Groupe créé avec succès');
              this.loadInitialData();
            },
            error: err => this.notificationService.showError('Erreur lors de la création')
          });
        }
      }
    });
  }

  deleteGroupe(groupe: Groupe): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Supprimer le groupe',
        message: `Êtes-vous sûr de vouloir supprimer le groupe <strong>${groupe.nom}</strong> ?<br><br>⚠️ Cette action supprimera également tous les types d'inspection associés.`,
        confirmText: 'Supprimer',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.deleteGroupe(groupe.id).subscribe({
          next: () => {
            this.notificationService.showSuccess('Groupe supprimé avec succès');
            this.loadInitialData();
          },
          error: (err) => this.notificationService.showError('Erreur de suppression')
        });
      }
    });
  }

  getFamilleNom(idFamille: string): string {
    return this.familles.find(f => f.id === idFamille)?.nom || 'Inconnue';
  }

  getFamilleCode(idFamille: string): string {
    return this.familles.find(f => f.id === idFamille)?.code || 'N/A';
  }

  getGroupesByFamille(idFamille: string): number {
    return this.allGroupes.filter(g => g.idFamille === idFamille).length;
  }
}