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
// ADDED: Import RouterLink for navigation
import { RouterLink } from '@angular/router';
import { Inspection } from '../../../../models/inspection.interface';

import { InspectionsService } from '../../services/inspections.service';
//import { Inspection, InspectionStatut, InspectionPriorite } from '../../../../core/models/inspection.interface';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

// Interface pour les données transformées
interface InspectionDisplay extends Omit<Inspection, 'statut'> {
  actifNom: string;
  inspecteurNom: string;
  datePrevue: Date;
  statut: string; // Override du statut en string pour l'affichage
}
// Ajoutez ces enums dans votre composant
enum InspectionStatut {
  PROGRAMMEE = 'PROGRAMMEE',
  EN_COURS = 'EN_COURS', 
  CLOTUREE = 'CLOTUREE',
  VALIDEE = 'VALIDEE',
  REJETEE = 'REJETEE'
}

enum InspectionPriorite {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE', 
  HAUTE = 'HAUTE',
  CRITIQUE = 'CRITIQUE'
}

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
    LoadingSpinnerComponent,
    RouterLink // ADDED: Add RouterLink to the component imports
  ],
  templateUrl: './inspections-list.component.html',
  styleUrls: ['./inspections-list.component.scss']
})
export class InspectionsListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'titre',
    'actifNom',
    'datePrevue',
    'statut',
    'priorite',
  ];


  
  dataSource = new MatTableDataSource<InspectionDisplay>();
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

  // The type <any> is used because the backend returns a paginated object.
  this.inspectionsService.getInspections().subscribe({
    next: (response: any) => { // Renamed to 'response' for clarity
      // Access the 'data' property which contains the array of inspections
      const inspectionsArray = response.data;

      

      // Add a check to ensure the data is actually an array
      if (!Array.isArray(inspectionsArray)) {
        console.error('Invalid response format: Expected an array of inspections.', response);
        this.error = 'Le format de la réponse du serveur est invalide.';
        this.isLoading = false;
        return;
      }

      // Map the correct array
      const transformedInspections: InspectionDisplay[] = inspectionsArray.map(inspection => ({
        ...inspection,
        actifNom: inspection.actifs?.[0]?.nom || 'Aucun actif',
        inspecteurNom: inspection.createur?.nom || 'Non assigné',
        datePrevue: typeof inspection.dateDebut === 'string' ? new Date(inspection.dateDebut) : inspection.dateDebut,
        statut: this.mapEtatToStatut(inspection.etat),
        priorite: inspection.priorite || 'normale'
      }));

      this.dataSource.data = transformedInspections;
      
      // (Recommended) Update the paginator's total length from the response
      if (this.paginator && response.meta) {
  this.paginator.length = response.meta.total;  
}

      this.isLoading = false;
      
      this.snackBar.open(`${transformedInspections.length} inspections chargées sur ${response.total}`, 'Fermer', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    },
    error: (error) => {
      console.error('Erreur lors du chargement des inspections:', error);
      this.error = 'Erreur lors du chargement des inspections. Vérifiez la console pour plus de détails.';
      this.isLoading = false;
      
      this.snackBar.open('Erreur lors du chargement', 'Fermer', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  });
}

  // Mapper les états de l'API vers les enum InspectionStatut
  private mapEtatToStatut(etat: string): string {
    const mapping: { [key: string]: string } = {
      'programmee': 'programmée',
      'en_cours': 'en cours', 
      'cloturee': 'Clôturée',    
      'validee': 'validée',
      'rejetee': 'rejetée'
    };
    return mapping[etat] || etat;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getStatutClass(statut: string): string {
    switch (statut.toLowerCase()) {
      case 'programmée':
        return 'status-scheduled';
      case 'en cours':
        return 'status-in-progress';
      case 'clôturée':
        return 'status-completed';
      case 'validée':
        return 'status-validated';
      case 'rejetée':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getPrioriteClass(priorite: string): string {
    switch (priorite?.toLowerCase()) {
      case 'basse':
        return 'priority-low';
      case 'normale':
        return 'priority-normal';
      case 'haute':
        return 'priority-high';
      case 'critique':
        return 'priority-critical';
      default:
        return 'priority-normal';
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

  editInspection(inspection: InspectionDisplay): void {
    console.log('Éditer inspection:', inspection);
    // TODO: Ouvrir dialog d'édition
  }

  viewInspection(inspection: InspectionDisplay): void {
    console.log('Voir inspection:', inspection);
    // TODO: Naviguer vers la vue détaillée
  }

  deleteInspection(inspection: InspectionDisplay): void {
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

  private performDelete(inspection: InspectionDisplay): void {
    
    this.inspectionsService.deleteInspection(Number(inspection.id)).subscribe({
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