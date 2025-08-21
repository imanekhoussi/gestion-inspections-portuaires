import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule} from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
import { FamilleDialogComponent } from './famille-dialog/famille-dialog.component';

@Component({
  selector: 'app-familles',
  standalone: true,
  imports: [
    CommonModule,  MatTableModule, MatPaginatorModule, MatSortModule,
    MatDialogModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatTooltipModule, MatBadgeModule
  ],
  templateUrl: './familles.component.html',
  styleUrls: ['./familles.component.scss']
})
export class FamillesComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['nom', 'code', 'nbGroupes', 'actions'];
  dataSource = new MatTableDataSource<Famille>();
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationAdminService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadFamilles();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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

  openFamilleDialog(famille?: Famille): void {
    const isEditMode = !!famille;
    const dialogRef = this.dialog.open(FamilleDialogComponent, {
      width: '500px',
      data: {
        isEditMode,
        famille: famille ? {...famille} : undefined
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (isEditMode && famille) {
          this.adminService.updateFamille(famille.id, result).subscribe({
            next: () => {
              this.notificationService.showSuccess('Famille modifiée avec succès');
              this.loadFamilles();
            },
            error: err => this.notificationService.showError('Erreur lors de la modification')
          });
        } else {
          this.adminService.createFamille(result).subscribe({
            next: () => {
              this.notificationService.showSuccess('Famille créée avec succès');
              this.loadFamilles();
            },
            error: err => this.notificationService.showError('Erreur lors de la création')
          });
        }
      }
    });
  }

  deleteFamille(famille: Famille): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Supprimer la famille',
        message: `Êtes-vous sûr de vouloir supprimer la famille <strong>${famille.nom}</strong>?<br><br>⚠️ Cette action supprimera également tous les groupes associés et leurs types d'inspection.`,
        confirmText: 'Supprimer',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.deleteFamille(famille.id).subscribe({
          next: () => {
            this.notificationService.showSuccess('Famille supprimée avec succès');
            this.loadFamilles();
          },
          error: (err) => this.notificationService.showError('Erreur lors de la suppression')
        });
      }
    });
  }
}