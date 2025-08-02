// src/app/features/admin/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    RouterModule
  ],
  template: `
    <div class="admin-dashboard">
      <div class="dashboard-header">
        <h1>
          <mat-icon>dashboard</mat-icon>
          Tableau de bord Administration
        </h1>
        <p>Gestion centralisée des inspections portuaires</p>
      </div>

      <div class="dashboard-grid">
        <mat-card class="dashboard-card" routerLink="/admin/utilisateurs">
          <mat-card-content>
            <div class="card-header">
              <mat-icon>people</mat-icon>
              <h3>Utilisateurs</h3>
            </div>
            <p>Gestion des comptes et rôles</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card" routerLink="/admin/familles">
          <mat-card-content>
            <div class="card-header">
              <mat-icon>folder</mat-icon>
              <h3>Familles</h3>
            </div>
            <p>Organisation des équipements</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card" routerLink="/admin/groupes">
          <mat-card-content>
            <div class="card-header">
              <mat-icon>group_work</mat-icon>
              <h3>Groupes</h3>
            </div>
            <p>Regroupement par catégories</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card" routerLink="/admin/types-inspection">
          <mat-card-content>
            <div class="card-header">
              <mat-icon>rule</mat-icon>
              <h3>Types d'inspection</h3>
            </div>
            <p>Configuration des contrôles</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card" routerLink="/admin/inspections">
          <mat-card-content>
            <div class="card-header">
              <mat-icon>assignment</mat-icon>
              <h3>Inspections</h3>
            </div>
            <p>Planification et suivi</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card" routerLink="/admin/arborescence">
          <mat-card-content>
            <div class="card-header">
              <mat-icon>account_tree</mat-icon>
              <h3>Arborescence</h3>
            </div>
            <p>Vue hiérarchique</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .dashboard-header {
      text-align: center;
      margin-bottom: 48px;
    }

    .dashboard-header h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 0 0 16px 0;
      font-size: 32px;
      font-weight: 300;
      color: #1976d2;
    }

    .dashboard-header mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
    }

    .dashboard-header p {
      margin: 0;
      color: #666;
      font-size: 18px;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .dashboard-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 12px;
      overflow: hidden;
    }

    .dashboard-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .card-header mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
    }

    .card-header h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
      color: #333;
    }

    .dashboard-card p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    @media (max-width: 768px) {
      .admin-dashboard {
        padding: 16px;
      }

      .dashboard-header h1 {
        font-size: 24px;
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  
  constructor() {}

  ngOnInit(): void {
    // Initialisation simple
  }
}