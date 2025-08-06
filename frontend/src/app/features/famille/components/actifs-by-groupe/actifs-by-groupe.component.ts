import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FamillesService, Actif } from '../../../../core/services/familles.service';

@Component({
  selector: 'app-actifs-by-groupe',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="actifs-container">
      <div class="actifs-header">
        <button mat-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Retour
        </button>
        <h1>Actifs du groupe {{ groupe?.nom || 'groupe' }}</h1>
        <p *ngIf="groupe?.code" class="groupe-code">Code: {{ groupe.code }}</p>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Chargement des actifs...</p>
      </div>

      <div *ngIf="actifs.length > 0 && !isLoading" class="actifs-grid">
        <mat-card *ngFor="let actif of actifs" class="actif-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">inventory_2</mat-icon>
            <mat-card-title>{{ actif.nom }}</mat-card-title>
            <mat-card-subtitle>{{ actif.code }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p><strong>Site:</strong> {{ actif.site }}</p>
            <p><strong>Zone:</strong> {{ actif.zone }}</p>
            <p><strong>Ouvrage:</strong> {{ actif.ouvrage }}</p>
            <p *ngIf="actif.indiceEtat"><strong>Indice État:</strong> {{ actif.indiceEtat }}/5</p>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card *ngIf="actifs.length === 0 && !isLoading" class="empty-card">
        <mat-card-content>
          <p>Aucun actif trouvé pour ce groupe.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .actifs-container {
      padding: 24px;
      background-color: #f5f5f5;
      min-height: calc(100vh - 64px);
    }
    
    .actifs-header h1 {
      color: #1976d2;
      margin: 16px 0;
    }
    
    .groupe-code {
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
    
    .actifs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 24px;
      margin-top: 24px;
    }
    
    .empty-card {
      text-align: center;
      margin: 40px auto;
      max-width: 400px;
    }
  `]
})
export class ActifsByGroupeComponent implements OnInit {
  groupe: any = null; // Ajouter la propriété groupe
  actifs: Actif[] = [];
  isLoading = true;
  groupeId!: number;

  constructor(
    private famillesService: FamillesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.groupeId = +params['groupeId'];
      this.loadGroupe(); // Charger les infos du groupe
      this.loadActifs();
    });
  }

  loadGroupe(): void {
    this.famillesService.getGroupeById(this.groupeId).subscribe({
      next: (groupe: any) => {
        this.groupe = groupe;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement du groupe:', error);
      }
    });
  }

  loadActifs(): void {
    this.isLoading = true;
    
    this.famillesService.getActifsByGroupe(this.groupeId).subscribe({
      next: (actifs: Actif[]) => {
        this.actifs = actifs;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erreur:', error);
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/familles']);
  }
}