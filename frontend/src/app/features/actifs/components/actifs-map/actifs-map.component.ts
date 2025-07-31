import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import * as L from 'leaflet';
import { ActifsService } from '../../services/actifs.service';
import { ActifGeoJSON, ActifFeature } from '../../../../core/models/actif.interface';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-actifs-map',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './actifs-map.component.html',
  styleUrls: ['./actifs-map.component.scss']
})
export class ActifsMapComponent implements OnInit, OnDestroy, AfterViewInit {
  private map!: L.Map;
  private actifMarkers: L.LayerGroup = L.layerGroup();
  
  isLoading = true;
  error: string | null = null;
  
  // Centre sur Tanger
  private readonly DEFAULT_COORDS: [number, number] = [35.7595, -5.8340];
  private readonly DEFAULT_ZOOM = 13;

  constructor(
    private actifsService: ActifsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeIcons();
  }

  ngAfterViewInit(): void {
    this.initializeMap();
    this.loadActifs();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeIcons(): void {
    // Fix pour les icônes Leaflet dans Angular
    const iconRetinaUrl = 'assets/marker-icon-2x.png';
    const iconUrl = 'assets/marker-icon.png';
    const shadowUrl = 'assets/marker-shadow.png';
    
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    
    L.Marker.prototype.options.icon = iconDefault;
  }

  private initializeMap(): void {
    this.map = L.map('map', {
      center: this.DEFAULT_COORDS,
      zoom: this.DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: true
    });

    // Ajouter la couche de base OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Ajouter le groupe de marqueurs à la carte
    this.actifMarkers.addTo(this.map);

    // Contrôles personnalisés
    this.addCustomControls();
  }

  private addCustomControls(): void {
    // Bouton de rechargement des données
    const refreshControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd: () => {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.innerHTML = '<button class="refresh-btn" title="Actualiser"><span>⟳</span></button>';
        
        L.DomEvent.on(container, 'click', (e) => {
          L.DomEvent.stopPropagation(e);
          this.loadActifs();
        });
        
        return container;
      }
    });

    new refreshControl().addTo(this.map);
  }

  private loadActifs(): void {
    this.isLoading = true;
    this.error = null;
    
    // Nettoyer les marqueurs existants
    this.actifMarkers.clearLayers();

    this.actifsService.getActifsGeoJSON().subscribe({
      next: (geoJson) => {
        this.displayActifs(geoJson);
        this.isLoading = false;
        
        this.snackBar.open(`${geoJson.features.length} actifs chargés`, 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des actifs:', error);
        this.error = 'Erreur lors du chargement des actifs';
        this.isLoading = false;
        
        this.snackBar.open('Erreur lors du chargement des actifs', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private displayActifs(geoJson: ActifGeoJSON): void {
    geoJson.features.forEach(feature => {
      const marker = this.createActifMarker(feature);
      this.actifMarkers.addLayer(marker);
    });

    // Ajuster la vue pour montrer tous les marqueurs
    if (geoJson.features.length > 0) {
      const group = new L.FeatureGroup(this.actifMarkers.getLayers() as L.Layer[]);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  private createActifMarker(feature: ActifFeature): L.Marker {
    const { coordinates } = feature.geometry;
    const { nom, site, zone, indiceEtat, description } = feature.properties;

    // Créer l'icône colorée selon l'indice d'état
    const icon = this.createColoredIcon(indiceEtat);
    
    // Créer le marqueur
    const marker = L.marker([coordinates[1], coordinates[0]], { icon });

    // Créer le popup
    const popupContent = this.createPopupContent(feature.properties);
    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: 'actif-popup'
    });

    // Tooltip au survol
    marker.bindTooltip(nom, {
      permanent: false,
      direction: 'top',
      offset: [0, -40]
    });

    return marker;
  }

  private createColoredIcon(indiceEtat: number): L.DivIcon {
    let color: string;
    let statusText: string;

    if (indiceEtat <= 2) {
      color = '#4caf50'; // Vert - Bon état
      statusText = 'Bon';
    } else if (indiceEtat === 3) {
      color = '#ff9800'; // Orange - Moyen
      statusText = 'Moyen';
    } else {
      color = '#f44336'; // Rouge - Mauvais état
      statusText = 'Mauvais';
    }

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="marker-pin" style="background-color: ${color};">
          <div class="marker-content">${indiceEtat}</div>
        </div>
        <div class="marker-shadow"></div>
      `,
      iconSize: [30, 42],
      iconAnchor: [15, 42],
      popupAnchor: [0, -42]
    });
  }

  private createPopupContent(properties: any): string {
    const { nom, site, zone, indiceEtat, description } = properties;
    
    let statusClass: string;
    let statusText: string;

    if (indiceEtat <= 2) {
      statusClass = 'status-good';
      statusText = 'Bon état';
    } else if (indiceEtat === 3) {
      statusClass = 'status-average';
      statusText = 'État moyen';
    } else {
      statusClass = 'status-poor';
      statusText = 'Mauvais état';
    }

    return `
      <div class="popup-content">
        <h3 class="popup-title">${nom}</h3>
        <div class="popup-details">
          <div class="detail-item">
            <strong>Site:</strong> ${site}
          </div>
          <div class="detail-item">
            <strong>Zone:</strong> ${zone}
          </div>
          <div class="detail-item">
            <strong>État:</strong> 
            <span class="status-badge ${statusClass}">
              ${statusText} (${indiceEtat}/5)
            </span>
          </div>
          ${description ? `
            <div class="detail-item">
              <strong>Description:</strong> ${description}
            </div>
          ` : ''}
        </div>
        <div class="popup-actions">
          <button class="popup-btn" onclick="console.log('Voir détails')">
            Voir détails
          </button>
        </div>
      </div>
    `;
  }

  public centerOnTanger(): void {
    this.map.setView(this.DEFAULT_COORDS, this.DEFAULT_ZOOM);
  }

  public refreshData(): void {
    this.loadActifs();
  }
}