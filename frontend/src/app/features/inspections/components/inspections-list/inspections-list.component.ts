import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe, SlicePipe, TitleCasePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import { InspectionsService } from '../../services/inspections.service';
import { Inspection, InspectionStatut, InspectionPriorite } from '../../../../core/models/inspection.interface';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-inspections-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    SlicePipe, 
    TitleCasePipe,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './inspections-list.component.html',
  styleUrls: ['./inspections-list.component.scss']
})
export class InspectionsListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'titre',
    'actifNom',
    'inspecteurNom',
    'datePrevue',
    'statut',
    'priorite',
    'conformite',
    'actions'
  ];

  dataSource = new MatTableDataSource<Inspection>();
  isLoading = true;
  error: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Enums pour les templates
  InspectionStatut = InspectionStatut;
  InspectionPriorite = InspectionPriorite;

  constructor(
    private inspectionsService: InspectionsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadInspections();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadInspections(): void {
    this.isLoading = true;
    this.error = null;

    this.inspectionsService.getInspections().subscribe({
      next: (inspections) => {
        this.dataSource.data = inspections;
        this.isLoading = false;
        
        this.snackBar.open(`${inspections.length} inspections chargées`, 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des inspections:', error);
        this.error = 'Erreur lors du chargement des inspections';
        this.isLoading = false;
        
        this.snackBar.open('Erreur lors du chargement', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
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

  getStatutClass(statut: InspectionStatut): string {
    switch (statut) {
      case InspectionStatut.PROGRAMMEE:
        return 'status-scheduled';
      case InspectionStatut.EN_COURS:
        return 'status-in-progress';
      case InspectionStatut.TERMINEE:
        return 'status-completed';
      case InspectionStatut.VALIDEE:
        return 'status-validated';
      case InspectionStatut.ANNULEE:
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getPrioriteClass(priorite: InspectionPriorite): string {
    switch (priorite) {
      case InspectionPriorite.BASSE:
        return 'priority-low';
      case InspectionPriorite.NORMALE:
        return 'priority-normal';
      case InspectionPriorite.HAUTE:
        return 'priority-high';
      case InspectionPriorite.CRITIQUE:
        return 'priority-critical';
      default:
        return '';
    }
  }

  getConformiteIcon(conformite?: boolean): string {
    if (conformite === undefined) return 'help';
    return conformite ? 'check_circle' : 'cancel';
  }

  getConformiteClass(conformite?: boolean): string {
    if (conformite === undefined) return 'conformite-unknown';
    return conformite ? 'conformite-ok' : 'conformite-nok';
  }

  editInspection(inspection: Inspection): void {
    console.log('Éditer inspection:', inspection);
    // TODO: Ouvrir dialog d'édition
  }

  viewInspection(inspection: Inspection): void {
    console.log('Voir inspection:', inspection);
    // TODO: Naviguer vers la vue détaillée
  }

  deleteInspection(inspection: Inspection): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer l\'inspection',
        message: `Êtes-vous sûr de vouloir supprimer l'inspection "${inspection.titre}" ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.performDelete(inspection);
      }
    });
  }

  private performDelete(inspection: Inspection): void {
    this.inspectionsService.deleteInspection(inspection.id).subscribe({
      next: () => {
        this.snackBar.open('Inspection supprimée avec succès', 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadInspections(); // Recharger la liste
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
        this.snackBar.open('Erreur lors de la suppression', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  refreshData(): void {
    this.loadInspections();
  }
}