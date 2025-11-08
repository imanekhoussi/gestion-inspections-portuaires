import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DashboardService, EvolutionIndicesRaw } from '../../services/dashboard.service';
import { DashboardKpis } from '../../../../core/models/dashboard.interface';
import { ActifsService } from '../../../actifs/services/actifs.service';

interface ZoneStatistic {
  site: string;
  zone: string;
  count: number;
}

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
    NgxChartsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // KPIs
  kpis: DashboardKpis | null = null;
  isLoading = true;
  error: string | null = null;

  // Charts
  isLoadingStats = false;
  errorStats: string | null = null;
  pieChartData: any[] = [];
  
  // Stats by condition
  assetsByCondition: { [key: string]: number } = {};
  totalAssets: number = 0;

  // Zone statistics
  zoneStatistics: ZoneStatistic[] = [];
  isLoadingZones = false;

  colorScheme: any = {
    domain: ['#10b981', '#f59e0b', '#ef4444']
  };

  // Updated condition labels to match actual data (only 3 conditions)
  conditionLabels: { [key: number]: { label: string; color: string; icon: string } } = {
    1: { label: 'Bon', color: '#10b981', icon: 'sentiment_satisfied' },
    2: { label: 'Moyen', color: '#f59e0b', icon: 'sentiment_neutral' },
    3: { label: 'Mauvais', color: '#ef4444', icon: 'sentiment_dissatisfied' }
  };

  constructor(
    private dashboardService: DashboardService,
    private actifService: ActifsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadKpis();
    this.loadStatistics();
    this.loadZoneStatistics();
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

  loadStatistics(): void {
    this.isLoadingStats = true;
    this.errorStats = null;

    this.dashboardService.getEvolutionIndices().subscribe({
      next: (data) => {
        this.transformPieChartData(data);
        this.calculateAssetsByCondition(data);
        this.isLoadingStats = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
        this.errorStats = 'Erreur lors du chargement des statistiques';
        this.isLoadingStats = false;
      }
    });
  }
// Replace the loadZoneStatistics method with this FIXED version:

loadZoneStatistics(): void {
  this.isLoadingZones = true;
  
  this.actifService.getStatistiquesByZone().subscribe({
    next: (data: any) => {
      // Reset array
      this.zoneStatistics = [];
      
      // Data is an array of objects with site, zone, and total properties
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if (item.site && item.zone && item.total !== undefined) {
            this.zoneStatistics.push({
              site: item.site,
              zone: item.zone,
              count: item.total
            });
          }
        });
      }
      
      // Sort by count descending
      this.zoneStatistics.sort((a, b) => b.count - a.count);
      this.isLoadingZones = false;
    },
    error: (error: any) => {
      console.error('Erreur lors du chargement des statistiques par zone:', error);
      this.isLoadingZones = false;
    }
  });
}

  transformPieChartData(data: EvolutionIndicesRaw[]): void {
    this.pieChartData = data.map(item => ({
      name: this.conditionLabels[item.indice]?.label || `Indice ${item.indice}`,
      value: parseInt(item.nombre, 10)
    }));
  }

  calculateAssetsByCondition(data: EvolutionIndicesRaw[]): void {
    this.totalAssets = 0;
    this.assetsByCondition = {};
    
    data.forEach(item => {
      const count = parseInt(item.nombre, 10);
      this.assetsByCondition[item.indice] = count;
      this.totalAssets += count;
    });
  }

  getConditionPercentage(indice: number): number {
    if (this.totalAssets === 0) return 0;
    return Math.round((this.assetsByCondition[indice] || 0) / this.totalAssets * 100);
  }

  getInspectionCompletionRate(): number {
    if (!this.kpis || this.kpis.totalInspections === 0) return 0;
    return Math.round((this.kpis.inspectionsValidees / this.kpis.totalInspections) * 100);
  }

  refreshData(): void {
    this.loadKpis();
    this.loadStatistics();
    this.loadZoneStatistics();
  }

  isAdmin(): boolean {
    const userRole = localStorage.getItem('userRole');
    return userRole === 'admin';
  }

  goToAdminInterface(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  // Get only the valid condition indices (1, 2, 3)
  getValidConditionIndices(): number[] {
    return [1, 2, 3];
  }
}