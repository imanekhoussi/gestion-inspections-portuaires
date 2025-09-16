import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActifDetailsDialogComponent } from '../actif-details-dialog/actif-details-dialog.component';
import { ActifsService } from '../../services/actifs.service';
import { Actif } from '../../../../core/models/actif.interface';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActifFormDialogComponent } from '../actif-form-dialog/actif-form-dialog.component';

@Component({
  selector: 'app-actifs-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
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
    LoadingSpinnerComponent,
    MatDialogModule
  ],
  templateUrl: './actifs-list.html',
  styleUrls: ['./actifs-list.scss']
})
export class ActifsListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['nom', 'site', 'zone', 'indiceEtat', 'actions'];
  dataSource = new MatTableDataSource<Actif>();
  isLoading = true;
  error: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private actifsService: ActifsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadActifs();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  openAddActifDialog(): void {
    console.log('➕ Ouverture du dialog de création d\'actif');
    
    const dialogData = {
      mode: 'create' as const  
    };
    
    const dialogRef = this.dialog.open(ActifFormDialogComponent, {
      width: '95vw',
      maxWidth: '1400px',
      height: '95vh',
      maxHeight: '900px',
      data: dialogData,
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open(`Actif "${result.nom}" créé avec succès !`, 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.refreshData();
      } else {
        console.log('🚫 Création annulée');
      }
    });
  }

  loadActifs(): void {
    this.isLoading = true;
    this.error = null;

    this.actifsService.getActifs().subscribe({
      next: (actifs) => {
        this.dataSource.data = actifs;
        this.isLoading = false;
        
        this.snackBar.open(`${actifs.length} actifs chargés`, 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des actifs:', error);
        this.error = 'Erreur lors du chargement des actifs';
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

  getEtatClass(indiceEtat: number): string {
    if (indiceEtat <= 2) return 'etat-poor';
    if (indiceEtat === 3) return 'etat-average';
    return 'etat-good';
  }

  getEtatText(indiceEtat: number): string {
    if (indiceEtat <= 2) return 'Mauvais';
    if (indiceEtat === 3) return 'Moyen';
    return 'Bon';
  }

  refreshData(): void {
    this.loadActifs();
  }
  
  showOnMap(actif: Actif): void {
    if (actif.geometry && actif.geometry.coordinates) {
      //  REDIRECTION vers la carte avec l'ID de l'actif
      this.router.navigate(['/actifs/map'], { 
        queryParams: { 
          actifId: actif.id,
          action: 'locate'
        }
      });
      
      this.snackBar.open(`Localisation de "${actif.nom}" sur la carte...`, '', {
        duration: 2000,
        panelClass: ['info-snackbar']
      });
      
    } else {
      this.snackBar.open(`L'actif "${actif.nom}" n'a pas de coordonnées GPS.`, 'Fermer', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  viewDetails(actif: Actif): void {
    const dialogRef = this.dialog.open(ActifDetailsDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: { actif: actif },
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'edit') {
       
        this.editActif(actif);
      }
    });
  }

 
  editActif(actif: Actif): void {
    console.log('🔧 Ouverture du dialog d\'édition pour:', actif);
    
    const dialogData = {
      actif: actif,           
      mode: 'edit' as const   
    };
    
    console.log('📦 Données passées au dialog:', dialogData);
    
    const dialogRef = this.dialog.open(ActifFormDialogComponent, {
      width: '95vw',
      maxWidth: '1400px',
      height: '95vh',
      maxHeight: '900px',
      data: dialogData,  
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open(`Actif "${result.nom}" modifié avec succès !`, 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.refreshData();
      } else {
        console.log('🚫 Modification annulée');
      }
    });
  }
}