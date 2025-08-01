// src/app/features/admin/components/arborescence/arborescence.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatTreeModule } from '@angular/material/tree';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';

import { AdminService } from '../../services/admin.service';
import { NotificationAdminService } from '../../services/notification-admin.service';
import { 
  ArborescenceNode, ArborescenceResponse, FiltresArborescence, EtatActif
} from '../../../../core/models/admin.interfaces';

interface TreeNode extends ArborescenceNode {
  level: number;
  expandable: boolean;
  isExpanded?: boolean;
  parent?: TreeNode;
  children: TreeNode[];
}

interface SiteStats {
  site: string;
  totalActifs: number;
  actifsParEtat: Record<EtatActif, number>;
  familles: number;
  groupes: number;
}

@Component({
  selector: 'app-arborescence',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatBadgeModule,
    MatChipsModule,
    MatTreeModule,
    MatProgressSpinnerModule,
    MatExpansionModule
  ],
  templateUrl: './arborescence.component.html',
  styleUrls: ['./arborescence.component.scss']
})
export class ArborescenceComponent implements OnInit {
  // Configuration de l'arbre
  treeControl = new NestedTreeControl<TreeNode>(node => node.children);
  dataSource = new MatTreeNestedDataSource<TreeNode>();

  // État du composant
  isLoading = true;
  arborescenceData: ArborescenceResponse | null = null;
  
  // Filtres
  filterForm!: FormGroup;
  availableSites: string[] = [];
  
  // Statistiques
  globalStats = {
    totalFamilles: 0,
    totalGroupes: 0,
    totalActifs: 0
  };
  
  siteStats: SiteStats[] = [];
  
  // Configuration des états
  etatActifOptions = [
    { value: 'Actif', label: 'Actif', color: '#4caf50', icon: 'check_circle' },
    { value: 'Maintenance', label: 'Maintenance', color: '#ff9800', icon: 'build' },
    { value: 'Arrêt', label: 'Arrêt', color: '#f44336', icon: 'pause_circle' },
    { value: 'Hors service', label: 'Hors service', color: '#757575', icon: 'cancel' }
  ];

  // Options d'affichage
  showMetadata = true;
  autoExpand = false;
  compactView = false;

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationAdminService,
    private fb: FormBuilder
  ) {
    this.initFilterForm();
  }

  ngOnInit(): void {
    this.loadArborescence();
  }

  private initFilterForm(): void {
    this.filterForm = this.fb.group({
      site: [''],
      etatActif: [''],
      expandAll: [false]
    });

    // Écouter les changements de filtres
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  loadArborescence(): void {
    this.isLoading = true;
    const filtres: FiltresArborescence = {
      ...this.filterForm.value,
      expandAll: this.autoExpand
    };

    this.adminService.getArborescence(filtres).subscribe({
      next: (data) => {
        this.arborescenceData = data;
        this.processArborescenceData(data);
        this.calculateStats(data);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'arborescence:', error);
        this.notificationService.showError('Erreur lors du chargement de l\'arborescence');
        this.isLoading = false;
      }
    });
  }

  private processArborescenceData(data: ArborescenceResponse): void {
    // Extraire tous les sites disponibles
    this.availableSites = this.extractSites(data.familles);
    
    // Convertir en format TreeNode
    const treeData = this.convertToTreeNodes(data.familles, 0);
    
    // Mettre à jour la source de données
    this.dataSource.data = treeData;
    
    // Appliquer l'expansion automatique si activée
    if (this.autoExpand) {
      this.expandAll();
    }

    // Mettre à jour les statistiques globales
    this.globalStats = {
      totalFamilles: data.totalFamilles,
      totalGroupes: data.totalGroupes,
      totalActifs: data.totalActifs
    };
  }

  private extractSites(familles: ArborescenceNode[]): string[] {
    const sites = new Set<string>();
    
    const extractFromNode = (node: ArborescenceNode) => {
      if (node.type === 'actif' && node.metadata?.site) {
        sites.add(node.metadata.site);
      }
      if (node.enfants) {
        node.enfants.forEach(extractFromNode);
      }
    };

    familles.forEach(extractFromNode);
    return Array.from(sites).sort();
  }

  private convertToTreeNodes(nodes: ArborescenceNode[], level: number, parent?: TreeNode): TreeNode[] {
    return nodes.map(node => {
      const treeNode: TreeNode = {
        ...node,
        level,
        expandable: !!(node.enfants && node.enfants.length > 0),
        isExpanded: false,
        parent,
        children: []
      };

      if (node.enfants && node.enfants.length > 0) {
        treeNode.children = this.convertToTreeNodes(node.enfants, level + 1, treeNode);
      }

      return treeNode;
    });
  }

  private calculateStats(data: ArborescenceResponse): void {
    const siteStatsMap = new Map<string, SiteStats>();

    const processNode = (node: ArborescenceNode) => {
      if (node.type === 'actif' && node.metadata?.site) {
        const site = node.metadata.site;
        
        if (!siteStatsMap.has(site)) {
          siteStatsMap.set(site, {
            site,
            totalActifs: 0,
            actifsParEtat: {
              'Actif': 0,
              'Maintenance': 0,
              'Arrêt': 0,
              'Hors service': 0
            },
            familles: 0,
            groupes: 0
          });
        }

        const stats = siteStatsMap.get(site)!;
        stats.totalActifs++;
        
        if (node.metadata.etat) {
          stats.actifsParEtat[node.metadata.etat]++;
        }
      }

      if (node.enfants) {
        node.enfants.forEach(processNode);
      }
    };

    data.familles.forEach(processNode);
    this.siteStats = Array.from(siteStatsMap.values()).sort((a, b) => a.site.localeCompare(b.site));
  }

  // ===== GESTION DE L'ARBRE =====

  hasChild = (_: number, node: TreeNode) => node.expandable;

  toggleNode(node: TreeNode): void {
    node.isExpanded = !node.isExpanded;
    if (node.isExpanded) {
      this.treeControl.expand(node);
    } else {
      this.treeControl.collapse(node);
    }
  }

  expandAll(): void {
    this.treeControl.expandAll();
    this.updateExpandedState(this.dataSource.data, true);
  }

  collapseAll(): void {
    this.treeControl.collapseAll();
    this.updateExpandedState(this.dataSource.data, false);
  }

  private updateExpandedState(nodes: TreeNode[], expanded: boolean): void {
    nodes.forEach(node => {
      node.isExpanded = expanded;
      if (node.children.length > 0) {
        this.updateExpandedState(node.children, expanded);
      }
    });
  }

  // ===== FILTRES =====

  applyFilters(): void {
    if (!this.arborescenceData) return;

    const filtres = this.filterForm.value;
    let filteredData = [...this.arborescenceData.familles];

    // Filtrage par site
    if (filtres.site) {
      filteredData = this.filterBySite(filteredData, filtres.site);
    }

    // Filtrage par état d'actif
    if (filtres.etatActif) {
      filteredData = this.filterByEtatActif(filteredData, filtres.etatActif);
    }

    // Convertir et mettre à jour
    const treeData = this.convertToTreeNodes(filteredData, 0);
    this.dataSource.data = treeData;

    // Appliquer l'expansion si demandée
    if (filtres.expandAll) {
      setTimeout(() => this.expandAll(), 100);
    }
  }

  private filterBySite(nodes: ArborescenceNode[], site: string): ArborescenceNode[] {
    return nodes.map(node => ({
      ...node,
      enfants: node.enfants ? this.filterBySite(node.enfants, site) : undefined
    })).filter(node => {
      if (node.type === 'actif') {
        return node.metadata?.site === site;
      }
      return node.enfants && node.enfants.length > 0;
    });
  }

  private filterByEtatActif(nodes: ArborescenceNode[], etat: EtatActif): ArborescenceNode[] {
    return nodes.map(node => ({
      ...node,
      enfants: node.enfants ? this.filterByEtatActif(node.enfants, etat) : undefined
    })).filter(node => {
      if (node.type === 'actif') {
        return node.metadata?.etat === etat;
      }
      return node.enfants && node.enfants.length > 0;
    });
  }

  clearFilters(): void {
    this.filterForm.reset({
      site: '',
      etatActif: '',
      expandAll: false
    });
  }

  // ===== UTILITAIRES =====

  getActifsParEtat(stats: any, etat: any): number {
  return stats.actifsParEtat[etat] || 0;
}

  getNodeIcon(node: TreeNode): string {
    switch (node.type) {
      case 'famille':
        return 'folder';
      case 'groupe':
        return 'group_work';
      case 'actif':
        return 'precision_manufacturing';
      default:
        return 'help_outline';
    }
  }

  getNodeIconColor(node: TreeNode): string {
    switch (node.type) {
      case 'famille':
        return '#1976d2';
      case 'groupe':
        return '#388e3c';
      case 'actif':
        if (node.metadata?.etat) {
          const etatOption = this.etatActifOptions.find(e => e.value === node.metadata?.etat);
          return etatOption?.color || '#666';
        }
        return '#666';
      default:
        return '#666';
    }
  }

  getNodeDescription(node: TreeNode): string {
    switch (node.type) {
      case 'famille':
        const nbGroupes = node.metadata?.nbGroupes || 0;
        const nbActifs = node.metadata?.nbActifs || 0;
        return `${nbGroupes} groupe(s), ${nbActifs} actif(s)`;
      case 'groupe':
        const nbActifsGroupe = node.metadata?.nbActifs || 0;
        return `${nbActifsGroupe} actif(s)`;
      case 'actif':
        return node.metadata?.site || 'Site inconnu';
      default:
        return '';
    }
  }

  getEtatActifIcon(etat: EtatActif): string {
    const option = this.etatActifOptions.find(e => e.value === etat);
    return option?.icon || 'help_outline';
  }

  getEtatActifColor(etat: EtatActif): string {
    const option = this.etatActifOptions.find(e => e.value === etat);
    return option?.color || '#666';
  }

  // ===== ACTIONS =====

  exportArborescence(): void {
    this.adminService.exporterDonnees('arborescence', this.filterForm.value).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `arborescence-${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.notificationService.showExportSuccess(link.download);
      },
      error: (error) => {
        console.error('Erreur lors de l\'export:', error);
        this.notificationService.showError('Erreur lors de l\'export');
      }
    });
  }

  refreshData(): void {
    this.loadArborescence();
    this.notificationService.showInfo('Données actualisées');
  }

  // ===== NAVIGATION =====

  navigateToEntity(node: TreeNode): void {
    switch (node.type) {
      case 'famille':
        // Navigation vers la gestion des familles
        break;
      case 'groupe':
        // Navigation vers la gestion des groupes
        break;
      case 'actif':
        // Navigation vers la gestion des actifs
        break;
    }
  }

  // ===== RECHERCHE =====

  searchInTree(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.applyFilters();
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filteredData = this.searchNodes(this.arborescenceData?.familles || [], searchLower);
    
    const treeData = this.convertToTreeNodes(filteredData, 0);
    this.dataSource.data = treeData;
    
    // Expand tous les nœuds pour montrer les résultats
    setTimeout(() => this.expandAll(), 100);
  }

  private searchNodes(nodes: ArborescenceNode[], searchTerm: string): ArborescenceNode[] {
    return nodes.map(node => {
      const matchesSearch = 
        node.nom.toLowerCase().includes(searchTerm) ||
        node.code.toLowerCase().includes(searchTerm);

      const filteredChildren = node.enfants ? this.searchNodes(node.enfants, searchTerm) : [];
      
      if (matchesSearch || filteredChildren.length > 0) {
        return {
          ...node,
          enfants: filteredChildren
        };
      }
      
      return null;
    }).filter(node => node !== null) as ArborescenceNode[];
  }
}