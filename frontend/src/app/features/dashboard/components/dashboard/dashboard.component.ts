import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardKpis } from '../../../../core/models/dashboard.interface';
import { KpiCardComponent } from '../kpi-card/kpi-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    KpiCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  kpis: DashboardKpis | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(private dashboardService: DashboardService, 
    private router: Router,) {}

  ngOnInit(): void {
    this.loadKpis();
  }

  loadKpis(): void {
    this.isLoading = true;
    this.error = null;

    this.dashboardService.getKpis().subscribe({
      next: (data: DashboardKpis) => {
        this.kpis = data;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des KPIs:', error);
        this.error = 'Erreur lors du chargement des données';
        this.isLoading = false;
      }
    });
  }

  refreshData(): void {
    this.loadKpis();
  }
  isAdmin(): boolean {
  // Vérifiez le rôle de l'utilisateur - adaptez selon votre système d'auth
  const userRole = localStorage.getItem('userRole'); 
  return userRole === 'admin';
}

  goToAdminInterface(): void {
  this.router.navigate(['/admin/dashboard']);
}
}