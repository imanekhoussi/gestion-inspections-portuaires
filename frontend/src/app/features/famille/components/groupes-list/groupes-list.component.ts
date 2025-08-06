import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FamillesService, Famille, Groupe } from '../../../../core/services/familles.service';

@Component({
  selector: 'app-groupes-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="groupes-container">
      <div class="groupes-header">
        <button mat-button (click)="goBackToFamilles()">
          <mat-icon>arrow_back</mat-icon>
          Retour aux familles
        </button>
        <h1>Groupes de {{ famille?.nom || 'la famille' }}</h1>
        <p *ngIf="famille?.code" class="famille-subtitle">{{ famille?.code }}</p>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Chargement des groupes...</p>
      </div>

      <div *ngIf="groupes.length > 0 && !isLoading" class="groupes-grid">
        <mat-card *ngFor="let groupe of groupes" class="groupe-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="accent">group_work</mat-icon>
            <mat-card-title>{{ groupe.nom }}</mat-card-title>
            <mat-card-subtitle>Code: {{ groupe.code }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="groupe-stats">
              <div class="stat-item">
                <mat-icon>inventory_2</mat-icon>
                <span>{{ groupe.nombreActifs || 0 }} actifs</span>
              </div>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary" (click)="navigateToActifs(groupe.id)">
              <mat-icon>visibility</mat-icon>
              Voir les actifs
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <mat-card *ngIf="groupes.length === 0 && !isLoading" class="empty-card">
        <mat-card-content>
          <p>Aucun groupe trouvé pour cette famille.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .groupes-container {
      padding: 24px;
      background-color: #f5f5f5;
      min-height: calc(100vh - 64px);
    }
    
    .groupes-header h1 {
      color: #1976d2;
      margin: 16px 0;
    }
    
    .famille-code {
      color: #666;
      margin: 0 0 16px 0;
      font-size: 1.1rem;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
    }
    
    .groupes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 24px;
      margin-top: 24px;
    }
    
    .groupe-stats {
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
  `]
})
export class GroupesListComponent implements OnInit {
  famille: Famille | null = null;
  groupes: Groupe[] = [];
  isLoading = true;
  familleId!: number;

  constructor(
    private famillesService: FamillesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.familleId = +params['familleId'];
      this.loadFamille(); // Charger les infos de la famille
      this.loadGroupes();
    });
  }

  loadFamille(): void {
    this.famillesService.getFamilleById(this.familleId).subscribe({
      next: (famille: Famille) => {
        this.famille = famille;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement de la famille:', error);
      }
    });
  }

  loadGroupes(): void {
    this.isLoading = true;
    
    this.famillesService.getGroupesByFamille(this.familleId).subscribe({
      next: (groupes: Groupe[]) => {
        this.groupes = groupes;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erreur:', error);
        this.isLoading = false;
      }
    });
  }

  navigateToActifs(groupeId: number): void {
    this.router.navigate(['/familles/groupes', groupeId, 'actifs']);
  }

  goBackToFamilles(): void {
    this.router.navigate(['/familles']);
  }
}