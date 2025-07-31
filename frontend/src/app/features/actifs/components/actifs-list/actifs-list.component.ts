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

import { ActifsService } from '../../services/actifs.service';
import { Actif } from '../../../../core/models/actif.interface';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

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
    LoadingSpinnerComponent
  ],
  template: `
    <div class="actifs-container">
      <div class="actifs-header">
        <div class="header-title">
          <h2>Liste des Actifs Portuaires</h2>
          <p class="header-subtitle">Gestion des équipements et infrastructures</p>
        </div>
        
        <div class="header-actions">
          <button 
            mat-raised-button 
            color="primary"
            (click)="refreshData()"
            [disabled]="isLoading"
            matTooltip="Actualiser la liste"
          >
            <mat-icon [class.rotating]="isLoading">refresh</mat-icon>
            Actualiser
          </button>
          
          <button 
            mat-raised-button 
            routerLink="/actifs/map"
            matTooltip="Voir la carte"
          >
            <mat-icon>map</mat-icon>
            Carte
          </button>
        </div>
      </div>

      <!-- Barre de recherche -->
      <mat-card class="search-card">
        <mat-card-content>
          <mat-form-field class="search-field" appearance="outline">
            <mat-label>Rechercher un actif</mat-label>
            <input 
              matInput 
              (keyup)="applyFilter($event)" 
              placeholder="Nom, site, zone..."
            >
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <app-loading-spinner message="Chargement des actifs..."></app-loading-spinner>
      </div>

      <!-- Error State -->
      <mat-card *ngIf="error && !isLoading" class="error-card">
        <mat-card-content>
          <div class="error-content">
            <mat-icon color="warn">error</mat-icon>
            <div>
              <h3>Erreur de chargement</h3>
              <p>{{ error }}</p>
              <button mat-raised-button color="primary" (click)="refreshData()">
                Réessayer
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Table des actifs -->
      <mat-card *ngIf="!isLoading && !error" class="table-card">
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="dataSource" matSort class="actifs-table">
              
              <!-- Colonne Nom -->
              <ng-container matColumnDef="nom">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Nom</th>
                <td mat-cell *matCellDef="let actif">
                  <div class="actif-name">
                    <strong>{{ actif.nom }}</strong>
                    <small *ngIf="actif.description">{{ actif.description | slice:0:40 }}{{ actif.description.length > 40 ? '...' : '' }}</small>
                  </div>
                </td>
              </ng-container>

              <!-- Colonne Site -->
              <ng-container matColumnDef="site">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Site</th>
                <td mat-cell *matCellDef="let actif">
                  <div class="site-info">
                    <mat-icon class="site-icon">business</mat-icon>
                    {{ actif.site }}
                  </div>
                </td>
              </ng-container>

              <!-- Colonne Zone -->
              <ng-container matColumnDef="zone">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Zone</th>
                <td mat-cell *matCellDef="let actif">
                  <div class="zone-info">
                    <mat-icon class="zone-icon">place</mat-icon>
                    {{ actif.zone }}
                  </div>
                </td>
              </ng-container>

              <!-- Colonne État -->
              <ng-container matColumnDef="indiceEtat">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>État</th>
                <td mat-cell *matCellDef="let actif">
                  <div class="etat-container">
                    <span class="etat-badge" [ngClass]="getEtatClass(actif.indiceEtat)">
                      {{ getEtatText(actif.indiceEtat) }}
                    </span>
                    <span class="etat-score">({{ actif.indiceEtat }}/5)</span>
                  </div>
                </td>
              </ng-container>

              <!-- Colonne Actions -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let actif">
                  <div class="action-buttons">
                    <button 
                      mat-icon-button 
                      matTooltip="Voir sur la carte"
                      class="action-map"
                    >
                      <mat-icon>location_on</mat-icon>
                    </button>
                    
                    <button 
                      mat-icon-button 
                      matTooltip="Voir les détails"
                      class="action-view"
                    >
                      <mat-icon>visibility</mat-icon>
                    </button>
                    
                    <button 
                      mat-icon-button 
                      matTooltip="Modifier"
                      class="action-edit"
                    >
                      <mat-icon>edit</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>

          <!-- Paginator -->
          <mat-paginator 
            [pageSizeOptions]="[10, 25, 50, 100]" 
            showFirstLastButtons
            [pageSize]="25"
          ></mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .actifs-container {
      padding: 24px;
      min-height: calc(100vh - 64px);
      background-color: #f5f5f5;
    }

    .actifs-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-title h2 {
      margin: 0 0 8px 0;
      color: #1976d2;
      font-weight: 400;
      font-size: 2rem;
    }

    .header-subtitle {
      margin: 0;
      color: #666;
      font-size: 1rem;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .search-card {
      margin-bottom: 24px;
    }

    .search-field {
      width: 400px;
      max-width: 100%;
    }

    .actif-name strong {
      display: block;
      font-size: 0.95rem;
      color: #333;
      margin-bottom: 4px;
    }

    .actif-name small {
      display: block;
      font-size: 0.8rem;
      color: #666;
      font-style: italic;
    }

    .site-info, .zone-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
    }

    .site-icon, .zone-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
      color: #666;
    }

    .etat-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .etat-badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .etat-good { background-color: #e8f5e8; color: #4caf50; }
    .etat-average { background-color: #fff3e0; color: #ff9800; }
    .etat-poor { background-color: #ffebee; color: #f44336; }

    .etat-score {
      font-size: 0.8rem;
      color: #666;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
    }

    .rotating {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
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
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadActifs();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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
    if (indiceEtat <= 2) return 'etat-good';
    if (indiceEtat === 3) return 'etat-average';
    return 'etat-poor';
  }

  getEtatText(indiceEtat: number): string {
    if (indiceEtat <= 2) return 'Bon';
    if (indiceEtat === 3) return 'Moyen';
    return 'Mauvais';
  }

  refreshData(): void {
    this.loadActifs();
  }
}