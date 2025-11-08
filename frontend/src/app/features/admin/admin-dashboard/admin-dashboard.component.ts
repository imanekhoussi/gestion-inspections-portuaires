// src/app/features/admin/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { AdminService } from '../services/admin.service';

interface DashboardStats {
  utilisateurs: number;
  familles: number;
  groupes: number;
  typesInspection: number;
  inspections: number;
  actifs: number;
}

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
            <div class="card-count" *ngIf="stats">
              <span class="count">{{ stats.utilisateurs }}</span>
              <span class="label">utilisateur{{ stats.utilisateurs > 1 ? 's' : '' }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card" routerLink="/admin/familles">
          <mat-card-content>
            <div class="card-header">
              <mat-icon>folder</mat-icon>
              <h3>Familles</h3>
            </div>
            <p>Organisation des équipements</p>
            <div class="card-count" *ngIf="stats">
              <span class="count">{{ stats.familles }}</span>
              <span class="label">famille{{ stats.familles > 1 ? 's' : '' }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card" routerLink="/admin/groupes">
          <mat-card-content>
            <div class="card-header">
              <mat-icon>group_work</mat-icon>
              <h3>Groupes</h3>
            </div>
            <p>Regroupement par catégories</p>
            <div class="card-count" *ngIf="stats">
              <span class="count">{{ stats.groupes }}</span>
              <span class="label">groupe{{ stats.groupes > 1 ? 's' : '' }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card" routerLink="/admin/types-inspection">
          <mat-card-content>
            <div class="card-header">
              <mat-icon>rule</mat-icon>
              <h3>Types d'inspection</h3>
            </div>
            <p>Configuration des contrôles</p>
            <div class="card-count" *ngIf="stats">
              <span class="count">{{ stats.typesInspection }}</span>
              <span class="label">type{{ stats.typesInspection > 1 ? 's' : '' }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card" routerLink="/admin/inspections">
          <mat-card-content>
            <div class="card-header">
              <mat-icon>assignment</mat-icon>
              <h3>Inspections</h3>
            </div>
            <p>Planification et suivi</p>
            <div class="card-count" *ngIf="stats">
              <span class="count">{{ stats.inspections }}</span>
              <span class="label">inspection{{ stats.inspections > 1 ? 's' : '' }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card" routerLink="/admin/arborescence">
          <mat-card-content>
            <div class="card-header">
              <mat-icon>account_tree</mat-icon>
              <h3>Arborescence</h3>
            </div>
            <p>Vue hiérarchique</p>
            <div class="card-count" *ngIf="stats">
              <span class="count">{{ stats.actifs }}</span>
              <span class="label">actif{{ stats.actifs > 1 ? 's' : '' }}</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="loading-overlay" *ngIf="loading">
        <mat-icon>refresh</mat-icon>
        <p>Chargement des statistiques...</p>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
      position: relative;
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
      position: relative;
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
      margin: 0 0 16px 0;
      color: #666;
      font-size: 14px;
    }

    .card-count {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e0e0e0;
    }

    .card-count .count {
      font-size: 28px;
      font-weight: 600;
      color: #1976d2;
    }

    .card-count .label {
      font-size: 14px;
      color: #666;
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 1000;
    }

    .loading-overlay mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1976d2;
      animation: spin 1s linear infinite;
    }

    .loading-overlay p {
      color: #666;
      font-size: 16px;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
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
  stats: DashboardStats | null = null;
  loading = true;
  
  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  private loadStatistics(): void {
    this.loading = true;

    // Load all counts in parallel
    Promise.all([
      this.adminService.getUtilisateurs().toPromise(),
      this.adminService.getFamilles().toPromise(),
      this.adminService.getGroupes().toPromise(),
      this.adminService.getTypesInspection().toPromise(),
      this.adminService.getInspections().toPromise(),
      this.adminService.getActifs().toPromise()
    ]).then(([utilisateurs, familles, groupes, typesInspection, inspections, actifs]) => {
      this.stats = {
        utilisateurs: utilisateurs?.length || 0,
        familles: familles?.length || 0,
        groupes: groupes?.length || 0,
        typesInspection: typesInspection?.length || 0,
        inspections: inspections?.total || inspections?.data?.length || 0,
        actifs: actifs?.total || actifs?.data?.length || 0
      };
      this.loading = false;
    }).catch(error => {
      console.error('Error loading statistics:', error);
      this.loading = false;
      // Set default stats on error
      this.stats = {
        utilisateurs: 0,
        familles: 0,
        groupes: 0,
        typesInspection: 0,
        inspections: 0,
        actifs: 0
      };
    });
  }
}