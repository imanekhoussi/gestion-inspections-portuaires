import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FamillesService, Famille } from '../../../../core/services/familles.service';

@Component({
  selector: 'app-familles-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="familles-container">
      <div class="familles-header">
        <h1>Familles d'Équipements</h1>
        <p class="familles-subtitle">Consultation des familles et de leurs groupes</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Chargement des familles...</p>
      </div>

      <!-- Error State -->
      <mat-card *ngIf="error && !isLoading" class="error-card">
        <mat-card-content>
          <div class="error-content">
            <mat-icon color="warn">error</mat-icon>
            <div>
              <h3>Erreur de chargement</h3>
              <p>{{ error }}</p>
              <button mat-raised-button color="primary" (click)="loadFamilles()">
                Réessayer
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Familles Grid -->
      <div *ngIf="familles.length > 0 && !isLoading" class="familles-grid">
        <mat-card 
          *ngFor="let famille of familles" 
          class="famille-card"
          (click)="navigateToGroupes(famille.id)"
        >
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">folder</mat-icon>
            <mat-card-title>{{ famille.nom }}</mat-card-title>
            <mat-card-subtitle>Code: {{ famille.code }}</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <div class="famille-stats">
              <div class="stat-item">
                <mat-icon>group_work</mat-icon>
                <span>{{ famille.nombreGroupes || 0 }} groupes</span>
              </div>
              <div class="stat-item">
                <mat-icon>inventory_2</mat-icon>
                <span>{{ famille.nombreActifs || 0 }} actifs</span>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button 
              mat-button 
              color="primary"
              (click)="navigateToGroupes(famille.id); $event.stopPropagation()"
            >
              <mat-icon>visibility</mat-icon>
              Consulter les groupes
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <!-- Empty State -->
      <mat-card *ngIf="familles.length === 0 && !isLoading && !error" class="empty-card">
        <mat-card-content>
          <div class="empty-content">
            <mat-icon>folder_open</mat-icon>
            <h3>Aucune famille trouvée</h3>
            <p>Il n'y a actuellement aucune famille d'équipements configurée.</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .familles-container {
      padding: 24px;
      min-height: calc(100vh - 64px);
      background-color: #f5f5f5;
    }

    .familles-header {
      margin-bottom: 32px;
    }
    
    .familles-header h1 {
      font-size: 2.5rem;
      font-weight: 300;
      color: #1976d2;
      margin: 0 0 8px 0;
    }
    
    .familles-subtitle {
      color: #666;
      font-size: 1.1rem;
      margin: 0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      gap: 16px;
    }
    
    .loading-container p {
      color: #666;
      font-size: 1rem;
    }

    .error-card {
      margin: 20px 0;
    }
    
    .error-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .error-content mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
    }
    
    .error-content h3 {
      margin: 0 0 8px 0;
      color: #d32f2f;
    }
    
    .error-content p {
      margin: 0 0 16px 0;
      color: #666;
    }

    .familles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 24px;
    }

    .famille-card {
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .famille-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .famille-stats {
      display: flex;
      gap: 16px;
      margin-top: 16px;
    }
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 0.9rem;
    }
    
    .stat-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .empty-card {
      text-align: center;
      margin: 40px auto;
      max-width: 400px;
    }
    
    .empty-content {
      padding: 40px 20px;
    }
    
    .empty-content mat-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }
    
    .empty-content h3 {
      margin: 0 0 8px 0;
      color: #666;
    }
    
    .empty-content p {
      margin: 0;
      color: #999;
    }

    @media (max-width: 768px) {
      .familles-container {
        padding: 16px;
      }
      
      .familles-header h1 {
        font-size: 2rem;
      }
      
      .familles-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }
  `]
})
export class FamillesListComponent implements OnInit {
  familles: Famille[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private famillesService: FamillesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFamilles();
  }

  loadFamilles(): void {
    this.isLoading = true;
    this.error = null;

    this.famillesService.getFamilles().subscribe({
      next: (familles: Famille[]) => {
        this.familles = familles;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des familles:', error);
        this.error = 'Erreur lors du chargement des familles';
        this.isLoading = false;
      }
    });
  }

  navigateToGroupes(familleId: number): void {
    this.router.navigate(['/familles', familleId, 'groupes']);
  }
}