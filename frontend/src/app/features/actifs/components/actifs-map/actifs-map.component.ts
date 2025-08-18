import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { ActifsService } from '../../services/actifs.service';
import { ActifGeoJSON, Actif } from '../../../../core/models/actif.interface'; 
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

// OpenLayers and ol-ext imports
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import LayerGroup from 'ol/layer/Group';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import { Style, Circle, Fill, Stroke, Text } from 'ol/style';
import Overlay from 'ol/Overlay';
import LayerSwitcher from 'ol-ext/control/LayerSwitcher';
import FullScreen from 'ol/control/FullScreen';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

interface FilterOption {
  value: string;
  label: string;
  count: number;
  checked: boolean;
}

interface EtatChip {
  value: string;
  label: string;
  count: number;
  selected: boolean;
  color: string;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  elementX: number;
  elementY: number;
}

@Component({
  selector: 'app-actifs-map',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatSelectModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatExpansionModule,
    MatChipsModule,
    FormsModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './actifs-map.component.html',
  styleUrls: ['./actifs-map.component.scss']
})
export class ActifsMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('popup') popupElementRef!: ElementRef;
  @ViewChild('popupContent') popupContentElementRef!: ElementRef;

  private map!: Map;
  private actifVectorSource = new VectorSource();
  private actifLayer!: VectorLayer<VectorSource>;
  private popupOverlay!: Overlay;
  private osmLayer!: TileLayer<OSM>;
  private satelliteLayer!: TileLayer<XYZ>;
  private allFeatures: any[] = [];
  
  isLoading = true;
  error: string | null = null;
  
  // Selected actif management
  selectedActifId: number | null = null;
  selectedActif: Actif | null = null;
  
  // UI State Management
  isLegendVisible = false;
  isFilterPanelVisible = true;
  
  // Filter options
  siteFilters: FilterOption[] = [];
  zoneFilters: FilterOption[] = [];
  etatChips: EtatChip[] = [
    { value: '1-2', label: 'Bon état (1-2)', count: 0, selected: true, color: '#4caf50' },
    { value: '3', label: 'État moyen (3)', count: 0, selected: true, color: '#ff9800' },
    { value: '4-5', label: 'Mauvais état (4-5)', count: 0, selected: true, color: '#f44336' }
  ];
  
  // Base map selection
  selectedBaseMap = 'osm';
  
  // Drag states for panels
  private filterPanelDrag: DragState = { isDragging: false, startX: 0, startY: 0, elementX: 0, elementY: 0 };
  private legendPanelDrag: DragState = { isDragging: false, startX: 0, startY: 0, elementX: 0, elementY: 0 };
  
  // Coordinates are [longitude, latitude] for OpenLayers
  private readonly DEFAULT_COORDS: [number, number] = [-5.51501, 35.87860];
  private readonly DEFAULT_ZOOM = 13;

  constructor(
    private actifsService: ActifsService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['actifId']) {
        this.selectedActifId = +params['actifId'];
        this.loadSpecificActif(this.selectedActifId);
      } else {
        this.loadActifs();
      }
    });
  }

  ngAfterViewInit(): void {
    this.initializeMap();
    setTimeout(() => {
      this.setupDraggablePanels();
    }, 100);
  }

  ngOnDestroy(): void {
    this.removePanels();
    if (this.map) {
      this.map.setTarget(undefined);
    }
  }

  private removePanels(): void {
    const filterPanel = document.querySelector('.floating-filter-panel');
    const legendPanel = document.querySelector('.floating-legend-panel');
    if (filterPanel) filterPanel.remove();
    if (legendPanel) legendPanel.remove();
  }

  private loadSpecificActif(actifId: number): void {
    this.isLoading = true;
    this.error = null;

    this.actifsService.getActifById(actifId).subscribe({
      next: (actif) => {
        this.selectedActif = actif;
        this.displaySingleActif(actif);
      },
      error: (error) => {
        console.error('Erreur chargement actif:', error);
        this.error = 'Erreur lors du chargement de l\'actif';
        this.isLoading = false;
        this.snackBar.open('Actif non trouvé', 'Fermer', { duration: 5000 });
      }
    });
  }

  private displaySingleActif(actif: Actif): void {
    this.actifVectorSource.clear();

    if (actif.geometry && actif.geometry.coordinates) {
      const feature = this.createActifFeature(actif);
      this.actifVectorSource.addFeature(feature);

      const geometry = feature.getGeometry();
      if (geometry) {
        const geometryType = actif.geometry.type;
        let padding = [100, 100, 100, 100];
        let maxZoom = 18;

        if (geometryType === 'Point') {
          maxZoom = 18;
          padding = [50, 50, 50, 50];
        } else if (geometryType === 'LineString') {
          maxZoom = 16;
          padding = [100, 100, 100, 100];
        } else if (geometryType === 'Polygon') {
          maxZoom = 15;
          padding = [150, 150, 150, 150];
        }

        this.map.getView().fit(geometry.getExtent(), {
          padding: padding,
          maxZoom: maxZoom,
          duration: 1500
        });
      }

      this.snackBar.open(`Actif "${actif.nom}" localisé`, '', { 
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    } else {
      this.snackBar.open('Cet actif n\'a pas de coordonnées GPS', 'Fermer', { 
        duration: 4000,
        panelClass: ['warning-snackbar']
      });
    }

    this.isLoading = false;
  }
  
  private createActifFeature(actif: Actif): Feature {
    const geoJsonFormat = new GeoJSON();
    
    const featureOrFeatures = geoJsonFormat.readFeature({
      type: 'Feature',
      geometry: actif.geometry,
      properties: {
        id: actif.id,
        nom: actif.nom,
        code: actif.code,
        site: actif.site,
        zone: actif.zone,
        indiceEtat: actif.indiceEtat,
        isSelected: true,
        geometryType: actif.geometry?.type
      }
    }, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });

    if (Array.isArray(featureOrFeatures)) {
      return featureOrFeatures[0];
    }
    return featureOrFeatures;
  }

  public goBackToList(): void {
    this.router.navigate(['/actifs/list']);
  }

  private getStyleByIndice(indice: number, isSelected: boolean = false, geometryType?: string): Style {
    // Uniform style when legend is hidden
    if (!this.isLegendVisible && !isSelected) {
      return this.getUniformStyle(geometryType);
    }

    let color: string;
    
    if (indice <= 2) {
      color = '#4caf50'; // Green - Good state
    } else if (indice === 3) {
      color = '#ff9800'; // Orange - Average state  
    } else {
      color = '#f44336'; // Red - Poor state
    }

    if (geometryType === 'LineString') {
      return new Style({
        stroke: new Stroke({ 
          color: isSelected ? '#2196f3' : color, 
          width: isSelected ? 6 : 4,
          lineDash: isSelected ? [15, 10] : undefined
        }),
        text: new Text({
          text: isSelected ? `🎯 ${indice}` : indice.toString(),
          fill: new Fill({ color: isSelected ? '#2196f3' : color }),
          font: isSelected ? 'bold 16px sans-serif' : 'bold 12px sans-serif',
          stroke: new Stroke({ color: 'white', width: 2 }),
          placement: 'line',
          maxAngle: Math.PI / 4
        })
      });
    } 
    else if (geometryType === 'Polygon') {
      return new Style({
        fill: new Fill({ 
          color: isSelected ? 'rgba(33, 150, 243, 0.3)' : `${color}40`
        }),
        stroke: new Stroke({ 
          color: isSelected ? '#2196f3' : color, 
          width: isSelected ? 4 : 2,
          lineDash: isSelected ? [10, 5] : undefined
        }),
        text: new Text({
          text: isSelected ? `🎯 ${indice}` : indice.toString(),
          fill: new Fill({ color: isSelected ? '#2196f3' : color }),
          font: isSelected ? 'bold 16px sans-serif' : 'bold 12px sans-serif',
          stroke: new Stroke({ color: 'white', width: 2 })
        })
      });
    } 
    else {
      return new Style({
        image: new Circle({
          radius: isSelected ? 15 : 10,
          fill: new Fill({ color: isSelected ? '#2196f3' : color }),
          stroke: new Stroke({ 
            color: 'white', 
            width: isSelected ? 4 : 2 
          })
        }),
        text: new Text({
          text: isSelected ? `🎯 ${indice}` : indice.toString(),
          fill: new Fill({ color: 'white' }),
          font: isSelected ? 'bold 14px sans-serif' : 'bold 12px sans-serif'
        })
      });
    }
  }

  private getUniformStyle(geometryType?: string): Style {
    const uniformColor = '#607d8b'; // Blue-grey uniform color

    if (geometryType === 'LineString') {
      return new Style({
        stroke: new Stroke({ 
          color: uniformColor, 
          width: 3
        })
      });
    } 
    else if (geometryType === 'Polygon') {
      return new Style({
        fill: new Fill({ 
          color: `${uniformColor}40`
        }),
        stroke: new Stroke({ 
          color: uniformColor, 
          width: 2
        })
      });
    } 
    else {
      return new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: uniformColor }),
          stroke: new Stroke({ 
            color: 'white', 
            width: 2 
          })
        })
      });
    }
  }

  // Public methods for template
  public toggleLegend(): void {
    this.isLegendVisible = !this.isLegendVisible;
    const legendPanel = document.querySelector('.floating-legend-panel') as HTMLElement;
    if (legendPanel) {
      legendPanel.style.display = this.isLegendVisible ? 'block' : 'none';
    }
    
    // Force re-style of features
    this.actifLayer.getSource()?.changed();
    
    this.snackBar.open(
      this.isLegendVisible ? 'Légende activée - Actifs colorés par état' : 'Légende désactivée - Style uniforme',
      'Fermer',
      { duration: 2000 }
    );
  }

  public toggleFilterPanel(): void {
    this.isFilterPanelVisible = !this.isFilterPanelVisible;
    const filterPanel = document.querySelector('.floating-filter-panel') as HTMLElement;
    if (filterPanel) {
      filterPanel.style.display = this.isFilterPanelVisible ? 'block' : 'none';
    }
  }

  public centerOnTanger(): void {
    this.map.getView().animate({
      center: fromLonLat(this.DEFAULT_COORDS),
      zoom: this.DEFAULT_ZOOM,
      duration: 1000
    });
  }

  public refreshData(): void {
    if (this.selectedActifId) {
      this.loadSpecificActif(this.selectedActifId);
    } else {
      this.loadActifs();
    }
  }

  public zoomToActifs(): void {
    if (this.actifVectorSource.getFeatures().length > 0) {
      const extent = this.actifVectorSource.getExtent();
      this.map.getView().fit(extent, {
        padding: [50, 50, 50, 50],
        duration: 1000,
        maxZoom: 16
      });
    }
  }
  // Add these methods to your ActifsMapComponent class (Part 2)

  private initializeMap(): void {
    this.osmLayer = new TileLayer({
      source: new OSM(),
      properties: { title: 'OpenStreetMap', baseLayer: true }
    });

    this.satelliteLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: 'Tiles © Esri',
      }),
      properties: { title: 'Satellite', baseLayer: true },
      visible: false
    });

    const baseLayers = new LayerGroup({
      layers: [this.osmLayer, this.satelliteLayer],
      properties: { title: 'Fonds de carte' }
    });

    this.actifLayer = new VectorLayer({
      source: this.actifVectorSource,
      properties: { title: 'Actifs Portuaires' },
      style: (feature) => {
        const indice = feature.get('indiceEtat') || 1;
        const isSelected = feature.get('isSelected') || false;
        const geometry = feature.getGeometry();
        const geometryType = geometry?.getType();
        
        return this.getStyleByIndice(indice, isSelected, geometryType);
      }
    });

    this.popupOverlay = new Overlay({
      element: this.popupElementRef.nativeElement,
      autoPan: {
        animation: {
          duration: 250
        }
      }
    });
    
    this.map = new Map({
      target: 'map',
      layers: [baseLayers, this.actifLayer],
      view: new View({
        center: fromLonLat(this.DEFAULT_COORDS),
        zoom: this.DEFAULT_ZOOM,
        projection: "EPSG:3857"
      }),
      overlays: [this.popupOverlay]
    });

    this.addMapControls();

    this.map.on('singleclick', (event) => {
      this.handleMapClick(event);
    });

    const closer = this.popupElementRef.nativeElement.querySelector('.ol-popup-closer');
    if (closer) {
      closer.onclick = () => {
        this.popupOverlay.setPosition(undefined);
        closer.blur();
        return false;
      };
    }
  }

  private createPopupContent(properties: any): string {
    const { nom, site, zone, indiceEtat, description, id, code } = properties;
    let statusClass: string, statusText: string;

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

    const isSelected = this.selectedActif?.id === id;
    const selectedBadge = isSelected ? '<div class="selected-badge">📍 Actif sélectionné</div>' : '';

    return `
      ${selectedBadge}
      <h3 class="popup-title">${nom || 'Actif sans nom'}</h3>
      <div class="popup-details">
        <div class="detail-item"><strong>Code:</strong> ${code || 'N/A'}</div>
        <div class="detail-item"><strong>Site:</strong> ${site || 'Non spécifié'}</div>
        <div class="detail-item"><strong>Zone:</strong> ${zone || 'Non spécifiée'}</div>
        <div class="detail-item">
          <strong>État:</strong> 
          <span class="status-badge ${statusClass}">${statusText} (${indiceEtat || 'N/A'}/5)</span>
        </div>
        ${description ? `<div class="detail-item"><strong>Description:</strong> ${description}</div>` : ''}
      </div>
    `;
  }

  private addMapControls(): void {
    const layerSwitcher = new LayerSwitcher();
    this.map.addControl(layerSwitcher);

    const fullScreen = new FullScreen();
    this.map.addControl(fullScreen);

    this.createFloatingPanels();
  }

  private createFloatingPanels(): void {
    this.createFloatingFilterPanel();
    this.createFloatingLegendPanel();
  }

  private createFloatingFilterPanel(): void {
    if (this.selectedActif) return; // Don't show filters for single actif view

    const filterPanel = document.createElement('div');
    filterPanel.className = 'floating-filter-panel';
    filterPanel.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      width: 340px;
      background: rgba(255, 255, 255, 0.98);
      border-radius: 16px;
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(20px);
      z-index: 1000;
      font-family: 'Roboto', sans-serif;
      overflow: hidden;
      transition: all 0.3s ease;
    `;

    filterPanel.innerHTML = `
      <div class="panel-header" style="
        background: linear-gradient(135deg, #1976d2, #1565c0);
        color: white;
        padding: 20px;
        cursor: move;
        display: flex;
        justify-content: space-between;
        align-items: center;
        user-select: none;
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>🔍</span>
          <h4 style="margin: 0; font-size: 16px; font-weight: 500;">Filtres</h4>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="togglePanel" style="
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          ">−</button>
          <button id="closePanel" style="
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          ">×</button>
        </div>
      </div>
      <div class="panel-content" style="padding: 24px;">
        ${this.generateFilterAccordionHTML()}
      </div>
    `;

    document.getElementById('map')?.appendChild(filterPanel);
    this.setupFilterPanelEvents(filterPanel);
  }

  private generateFilterAccordionHTML(): string {
    return `
      <!-- Base Map Selection -->
      <div class="filter-section" style="margin-bottom: 24px;">
        <label style="display: block; font-weight: 600; margin-bottom: 12px; color: #333; font-size: 14px;">Fond de carte:</label>
        <select class="base-map-select" style="
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 14px;
          background: white;
          cursor: pointer;
          transition: border-color 0.2s;
        ">
          <option value="osm">OpenStreetMap</option>
          <option value="satellite">Satellite</option>
        </select>
      </div>

      <!-- État Filter as Chips -->
      <div class="filter-section" style="margin-bottom: 24px;">
        <label style="display: block; font-weight: 600; margin-bottom: 12px; color: #333; font-size: 14px;">État des actifs:</label>
        <div class="etat-chips" style="display: flex; flex-wrap: wrap; gap: 10px;">
          ${this.generateEtatChipsHTML()}
        </div>
      </div>

      <!-- Accordion for Sites and Zones -->
      <div class="filter-accordion">
        <div class="accordion-item" style="border: 1px solid #e0e0e0; border-radius: 12px; margin-bottom: 16px; overflow: hidden;">
          <div class="accordion-header" style="
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: 16px 20px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 500;
            font-size: 14px;
            transition: background-color 0.2s;
          " data-target="sites">
            <span>🏢 Sites</span>
            <span class="accordion-icon" style="transition: transform 0.3s;">▼</span>
          </div>
          <div class="accordion-content" id="sites-content" style="
            max-height: 200px;
            overflow-y: auto;
            padding: 16px 20px;
            background: white;
            display: none;
          ">
            <div id="site-filters"></div>
          </div>
        </div>

        <div class="accordion-item" style="border: 1px solid #e0e0e0; border-radius: 12px; margin-bottom: 16px; overflow: hidden;">
          <div class="accordion-header" style="
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: 16px 20px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 500;
            font-size: 14px;
            transition: background-color 0.2s;
          " data-target="zones">
            <span>📍 Zones</span>
            <span class="accordion-icon" style="transition: transform 0.3s;">▼</span>
          </div>
          <div class="accordion-content" id="zones-content" style="
            max-height: 200px;
            overflow-y: auto;
            padding: 16px 20px;
            background: white;
            display: none;
          ">
            <div id="zone-filters"></div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="filter-actions" style="
        display: flex;
        gap: 12px;
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid #e0e0e0;
      ">
        <button class="filter-btn reset-btn" style="
          flex: 1;
          padding: 12px 20px;
          background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
          color: #666;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s ease;
        ">Réinitialiser</button>
        <button class="filter-btn apply-btn" style="
          flex: 1;
          padding: 12px 20px;
          background: linear-gradient(135deg, #1976d2, #1565c0);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s ease;
        ">Appliquer</button>
      </div>
    `;
  }

  private generateEtatChipsHTML(): string {
    return this.etatChips.map(chip => `
      <div class="etat-chip ${chip.selected ? 'selected' : ''}" 
           data-value="${chip.value}"
           style="
             padding: 10px 16px;
             border-radius: 25px;
             cursor: pointer;
             font-size: 13px;
             font-weight: 500;
             transition: all 0.3s ease;
             border: 2px solid ${chip.color};
             background: ${chip.selected ? chip.color : 'white'};
             color: ${chip.selected ? 'white' : chip.color};
           ">
        ${chip.label} (${chip.count})
      </div>
    `).join('');
  }

  private createFloatingLegendPanel(): void {
    const legendPanel = document.createElement('div');
    legendPanel.className = 'floating-legend-panel';
    legendPanel.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 300px;
      background: rgba(255, 255, 255, 0.98);
      border-radius: 16px;
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(20px);
      z-index: 1000;
      font-family: 'Roboto', sans-serif;
      overflow: hidden;
      display: ${this.isLegendVisible ? 'block' : 'none'};
      transition: all 0.3s ease;
    `;

    legendPanel.innerHTML = `
      <div class="panel-header" style="
        background: linear-gradient(135deg, #4caf50, #45a049);
        color: white;
        padding: 20px;
        cursor: move;
        display: flex;
        justify-content: space-between;
        align-items: center;
        user-select: none;
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>🗺️</span>
          <h4 style="margin: 0; font-size: 16px; font-weight: 500;">Légende</h4>
        </div>
        <button id="closeLegend" style="
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        ">×</button>
      </div>
      <div class="panel-content" style="padding: 24px;">
        ${this.generateLegendContentHTML()}
      </div>
    `;

    document.getElementById('map')?.appendChild(legendPanel);
    this.setupLegendPanelEvents(legendPanel);
  }

  private generateLegendContentHTML(): string {
    return `
      ${this.selectedActif ? `
        <div class="selected-actif-info" style="
          background: linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.05));
          border-left: 4px solid #2196f3;
          padding: 16px;
          margin-bottom: 20px;
          border-radius: 8px;
        ">
          <strong style="color: #1976d2; font-size: 16px; display: block; margin-bottom: 4px;">🎯 ${this.selectedActif.nom}</strong>
          <small style="color: #666; font-family: monospace; background: rgba(255, 255, 255, 0.7); padding: 2px 6px; border-radius: 4px; font-size: 12px;">${this.selectedActif.code}</small>
        </div>
      ` : ''}
      
      <div class="legend-items">
        ${this.etatChips.map(chip => `
          <div class="legend-item clickable" 
               data-etat="${chip.value}"
               style="
                 display: flex;
                 align-items: center;
                 gap: 12px;
                 padding: 12px;
                 margin-bottom: 8px;
                 border-radius: 10px;
                 cursor: pointer;
                 transition: all 0.2s ease;
                 opacity: ${chip.selected ? '1' : '0.5'};
               ">
            <div class="legend-symbol" style="
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background-color: ${chip.color};
              border: 2px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              flex-shrink: 0;
            "></div>
            <span style="font-size: 14px; color: #555; font-weight: 500;">${chip.label}</span>
          </div>
        `).join('')}
      </div>
      
      ${this.selectedActif ? `
        <button class="back-btn" onclick="window.location.href='/actifs/list'" style="
          width: 100%;
          padding: 14px 20px;
          background: linear-gradient(135deg, #2196f3, #1976d2);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          margin-top: 20px;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s ease;
        ">
          ← Retour à la liste
        </button>
      ` : ''}
    `;
  }

  private handleMapClick(event: any): void {
    this.popupOverlay.setPosition(undefined);
    
    this.map.forEachFeatureAtPixel(event.pixel, (feature) => {
      const properties = feature.getProperties();
      this.popupContentElementRef.nativeElement.innerHTML = this.createPopupContent(properties);
      this.popupOverlay.setPosition(event.coordinate);
      return true;
    });
  }
  // Add these methods to your ActifsMapComponent class (Part 3)

  private setupFilterPanelEvents(panel: HTMLElement): void {
    // Panel toggle and close
    const toggleBtn = panel.querySelector('#togglePanel');
    const closeBtn = panel.querySelector('#closePanel');
    const content = panel.querySelector('.panel-content') as HTMLElement;

    toggleBtn?.addEventListener('click', () => {
      const isVisible = content.style.display !== 'none';
      content.style.display = isVisible ? 'none' : 'block';
      (toggleBtn as HTMLElement).textContent = isVisible ? '+' : '−';
    });

    closeBtn?.addEventListener('click', () => {
      this.isFilterPanelVisible = false;
      panel.style.display = 'none';
    });

    // Base map switcher
    const baseMapSelect = panel.querySelector('.base-map-select') as HTMLSelectElement;
    baseMapSelect?.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.switchBaseMap(target.value);
    });

    // Accordion functionality
    const accordionHeaders = panel.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const target = header.getAttribute('data-target');
        const content = panel.querySelector(`#${target}-content`) as HTMLElement;
        const icon = header.querySelector('.accordion-icon') as HTMLElement;
        
        if (content) {
          const isVisible = content.style.display === 'block';
          content.style.display = isVisible ? 'none' : 'block';
          icon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
        }
      });

      // Hover effects
      header.addEventListener('mouseenter', () => {
        (header as HTMLElement).style.background = 'linear-gradient(135deg, #e8f5e8, #d4edda)';
      });
      
      header.addEventListener('mouseleave', () => {
        (header as HTMLElement).style.background = 'linear-gradient(135deg, #f8f9fa, #e9ecef)';
      });
    });

    // État chips functionality
    this.setupEtatChipsEvents(panel);

    // Filter buttons
    const resetBtn = panel.querySelector('.reset-btn');
    const applyBtn = panel.querySelector('.apply-btn');

    resetBtn?.addEventListener('click', () => {
      this.resetAllFilters();
      this.updateFilterPanelDisplay(panel);
    });

    applyBtn?.addEventListener('click', () => {
      this.applyFilters();
    });

    // Button hover effects
    this.setupButtonHoverEffects(resetBtn, applyBtn);
  }

  private setupEtatChipsEvents(panel: HTMLElement): void {
    const etatChips = panel.querySelectorAll('.etat-chip');
    etatChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const value = chip.getAttribute('data-value');
        if (value) {
          this.toggleEtatChip(value);
          this.updateEtatChipsDisplay(panel);
        }
      });

      // Hover effects for chips
      chip.addEventListener('mouseenter', () => {
        if (!chip.classList.contains('selected')) {
          const color = this.getChipColor(chip.getAttribute('data-value') || '');
          (chip as HTMLElement).style.background = `${color}20`;
        }
        (chip as HTMLElement).style.transform = 'translateY(-2px)';
        (chip as HTMLElement).style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      });

      chip.addEventListener('mouseleave', () => {
        if (!chip.classList.contains('selected')) {
          (chip as HTMLElement).style.background = 'white';
        }
        (chip as HTMLElement).style.transform = 'translateY(0)';
        (chip as HTMLElement).style.boxShadow = 'none';
      });
    });
  }

  private setupButtonHoverEffects(resetBtn: Element | null, applyBtn: Element | null): void {
    resetBtn?.addEventListener('mouseenter', () => {
      (resetBtn as HTMLElement).style.background = 'linear-gradient(135deg, #e0e0e0, #bdbdbd)';
      (resetBtn as HTMLElement).style.transform = 'translateY(-2px)';
      (resetBtn as HTMLElement).style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
    });
    
    resetBtn?.addEventListener('mouseleave', () => {
      (resetBtn as HTMLElement).style.background = 'linear-gradient(135deg, #f5f5f5, #e0e0e0)';
      (resetBtn as HTMLElement).style.transform = 'translateY(0)';
      (resetBtn as HTMLElement).style.boxShadow = 'none';
    });

    applyBtn?.addEventListener('mouseenter', () => {
      (applyBtn as HTMLElement).style.background = 'linear-gradient(135deg, #1565c0, #0d47a1)';
      (applyBtn as HTMLElement).style.transform = 'translateY(-2px)';
      (applyBtn as HTMLElement).style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
    });
    
    applyBtn?.addEventListener('mouseleave', () => {
      (applyBtn as HTMLElement).style.background = 'linear-gradient(135deg, #1976d2, #1565c0)';
      (applyBtn as HTMLElement).style.transform = 'translateY(0)';
      (applyBtn as HTMLElement).style.boxShadow = 'none';
    });
  }

  private setupLegendPanelEvents(panel: HTMLElement): void {
    const closeBtn = panel.querySelector('#closeLegend');
    closeBtn?.addEventListener('click', () => {
      this.toggleLegend();
    });

    // Interactive legend items
    const legendItems = panel.querySelectorAll('.legend-item.clickable');
    legendItems.forEach(item => {
      item.addEventListener('click', () => {
        const etatValue = item.getAttribute('data-etat');
        if (etatValue) {
          this.toggleEtatChip(etatValue);
          this.updateLegendDisplay(panel);
          this.applyFilters();
        }
      });

      // Hover effects for legend items
      item.addEventListener('mouseenter', () => {
        (item as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        (item as HTMLElement).style.transform = 'translateX(4px)';
        const symbol = item.querySelector('.legend-symbol') as HTMLElement;
        if (symbol) symbol.style.transform = 'scale(1.1)';
      });

      item.addEventListener('mouseleave', () => {
        (item as HTMLElement).style.backgroundColor = 'transparent';
        (item as HTMLElement).style.transform = 'translateX(0)';
        const symbol = item.querySelector('.legend-symbol') as HTMLElement;
        if (symbol) symbol.style.transform = 'scale(1)';
      });
    });
  }

  private setupDraggablePanels(): void {
    this.setupDraggable('.floating-filter-panel', this.filterPanelDrag);
    this.setupDraggable('.floating-legend-panel', this.legendPanelDrag);
  }

  private setupDraggable(selector: string, dragState: DragState): void {
    const panel = document.querySelector(selector) as HTMLElement;
    if (!panel) return;

    const header = panel.querySelector('.panel-header') as HTMLElement;
    if (!header) return;

    header.addEventListener('mousedown', (e: MouseEvent) => {
      dragState.isDragging = true;
      dragState.startX = e.clientX;
      dragState.startY = e.clientY;
      
      const rect = panel.getBoundingClientRect();
      dragState.elementX = rect.left;
      dragState.elementY = rect.top;

      header.style.cursor = 'grabbing';
      panel.style.userSelect = 'none';
      panel.style.transition = 'none';

      e.preventDefault();
    });

    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (!dragState.isDragging) return;

      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;

      const newX = dragState.elementX + deltaX;
      const newY = dragState.elementY + deltaY;

      // Constrain to viewport
      const maxX = window.innerWidth - panel.offsetWidth;
      const maxY = window.innerHeight - panel.offsetHeight;

      panel.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
      panel.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
    });

    document.addEventListener('mouseup', () => {
      if (dragState.isDragging) {
        dragState.isDragging = false;
        header.style.cursor = 'move';
        panel.style.userSelect = '';
        panel.style.transition = 'all 0.3s ease';
      }
    });
  }

  private toggleEtatChip(value: string): void {
    const chip = this.etatChips.find(c => c.value === value);
    if (chip) {
      chip.selected = !chip.selected;
    }
  }

  private getChipColor(value: string): string {
    const chip = this.etatChips.find(c => c.value === value);
    return chip?.color || '#607d8b';
  }

  private updateEtatChipsDisplay(panel: HTMLElement): void {
    const chipsContainer = panel.querySelector('.etat-chips');
    if (chipsContainer) {
      chipsContainer.innerHTML = this.generateEtatChipsHTML();
      this.setupEtatChipsEvents(panel);
    }
  }

  private updateLegendDisplay(panel: HTMLElement): void {
    const legendItems = panel.querySelectorAll('.legend-item.clickable');
    legendItems.forEach((item, index) => {
      const chip = this.etatChips[index];
      if (chip) {
        (item as HTMLElement).style.opacity = chip.selected ? '1' : '0.5';
      }
    });
  }

  private updateFilterPanelDisplay(panel: HTMLElement): void {
    this.updateEtatChipsDisplay(panel);
    this.populateFilterCheckboxes();
  }

  private switchBaseMap(mapType: string): void {
    if (mapType === 'satellite') {
      this.osmLayer.setVisible(false);
      this.satelliteLayer.setVisible(true);
    } else {
      this.osmLayer.setVisible(true);
      this.satelliteLayer.setVisible(false);
    }
    this.selectedBaseMap = mapType;
  }
  // Add these methods to your ActifsMapComponent class (Part 4)

  private loadActifs(): void {
    this.isLoading = true;
    this.error = null;
    this.actifVectorSource.clear();

    this.actifsService.getActifsGeoJSON().subscribe({
      next: (geoJson) => {
        try {
          const features = new GeoJSON().readFeatures(geoJson, {
            featureProjection: 'EPSG:3857'
          });
          
          this.allFeatures = features;
          this.generateFilterOptions();
          this.actifVectorSource.addFeatures(features);
          
          if (features.length > 0) {
            this.snackBar.open(`${features.length} actifs chargés avec succès`, 'Fermer', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          } else {
            this.snackBar.open('Aucun actif trouvé', 'Fermer', {
              duration: 3000,
              panelClass: ['warning-snackbar']
            });
          }
        } catch (parseError) {
          console.error('Error parsing GeoJSON:', parseError);
          this.error = 'Erreur lors de l\'analyse des données cartographiques';
          this.snackBar.open('Erreur lors de l\'analyse des données', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        } finally {
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des actifs:', err);
        this.error = 'Erreur lors du chargement des actifs';
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des données', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private generateFilterOptions(): void {
    const sites: { [key: string]: number } = {};
    const zones: { [key: string]: number } = {};
    const etats: { [key: string]: number } = {};

    this.allFeatures.forEach(feature => {
      const props = feature.getProperties();
      
      if (props.site) {
        sites[props.site] = (sites[props.site] || 0) + 1;
      }
      
      if (props.zone) {
        zones[props.zone] = (zones[props.zone] || 0) + 1;
      }
      
      const indice = props.indiceEtat || 1;
      let etatKey = '';
      if (indice <= 2) etatKey = '1-2';
      else if (indice === 3) etatKey = '3';
      else etatKey = '4-5';
      
      etats[etatKey] = (etats[etatKey] || 0) + 1;
    });

    this.siteFilters = Object.keys(sites).map(site => ({
      value: site,
      label: site,
      count: sites[site],
      checked: true
    }));

    this.zoneFilters = Object.keys(zones).map(zone => ({
      value: zone,
      label: zone,
      count: zones[zone],
      checked: true
    }));

    this.etatChips.forEach(chip => {
      chip.count = etats[chip.value] || 0;
    });

    setTimeout(() => {
      this.populateFilterCheckboxes();
    }, 100);
  }

  private populateFilterCheckboxes(): void {
    const siteContainer = document.getElementById('site-filters');
    if (siteContainer) {
      siteContainer.innerHTML = this.siteFilters.map(filter => `
        <div class="filter-checkbox" style="
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          border-radius: 6px;
          transition: all 0.2s ease;
        ">
          <input type="checkbox" id="site-${filter.value}" ${filter.checked ? 'checked' : ''} style="
            transform: scale(1.2);
            cursor: pointer;
            accent-color: #1976d2;
          ">
          <label for="site-${filter.value}" style="
            font-size: 13px;
            color: #555;
            cursor: pointer;
            flex: 1;
            margin: 0;
            transition: color 0.2s ease;
          ">${filter.label} (${filter.count})</label>
        </div>
      `).join('');
    }

    const zoneContainer = document.getElementById('zone-filters');
    if (zoneContainer) {
      zoneContainer.innerHTML = this.zoneFilters.map(filter => `
        <div class="filter-checkbox" style="
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          border-radius: 6px;
          transition: all 0.2s ease;
        ">
          <input type="checkbox" id="zone-${filter.value}" ${filter.checked ? 'checked' : ''} style="
            transform: scale(1.2);
            cursor: pointer;
            accent-color: #1976d2;
          ">
          <label for="zone-${filter.value}" style="
            font-size: 13px;
            color: #555;
            cursor: pointer;
            flex: 1;
            margin: 0;
            transition: color 0.2s ease;
          ">${filter.label} (${filter.count})</label>
        </div>
      `).join('');
    }

    // Add hover effects to checkboxes
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
      checkbox.addEventListener('mouseenter', () => {
        (checkbox as HTMLElement).style.backgroundColor = 'rgba(25, 118, 210, 0.05)';
        (checkbox as HTMLElement).style.paddingLeft = '8px';
        (checkbox as HTMLElement).style.paddingRight = '8px';
        const label = checkbox.querySelector('label') as HTMLElement;
        if (label) label.style.color = '#1976d2';
      });
      
      checkbox.addEventListener('mouseleave', () => {
        (checkbox as HTMLElement).style.backgroundColor = 'transparent';
        (checkbox as HTMLElement).style.paddingLeft = '0';
        (checkbox as HTMLElement).style.paddingRight = '0';
        const label = checkbox.querySelector('label') as HTMLElement;
        if (label) label.style.color = '#555';
      });
    });
  }

  private resetAllFilters(): void {
    this.siteFilters.forEach(filter => filter.checked = true);
    this.zoneFilters.forEach(filter => filter.checked = true);
    this.etatChips.forEach(chip => chip.selected = true);
    this.applyFilters();
  }

  private applyFilters(): void {
    const checkedSites = this.getCheckedSiteFilters();
    const checkedZones = this.getCheckedZoneFilters();
    const selectedEtats = this.etatChips.filter(chip => chip.selected).map(chip => chip.value);

    const filteredFeatures = this.allFeatures.filter(feature => {
      const props = feature.getProperties();
      
      if (checkedSites.length > 0 && !checkedSites.includes(props.site)) {
        return false;
      }
      
      if (checkedZones.length > 0 && !checkedZones.includes(props.zone)) {
        return false;
      }
      
      const indice = props.indiceEtat || 1;
      let etatKey = '';
      if (indice <= 2) etatKey = '1-2';
      else if (indice === 3) etatKey = '3';
      else etatKey = '4-5';
      
      if (selectedEtats.length > 0 && !selectedEtats.includes(etatKey)) {
        return false;
      }
      
      return true;
    });

    this.actifVectorSource.clear();
    this.actifVectorSource.addFeatures(filteredFeatures);

    // Update the map layer style to reflect legend visibility
    this.actifLayer.getSource()?.changed();

    this.snackBar.open(`${filteredFeatures.length} actifs affichés`, 'Fermer', {
      duration: 2000
    });
  }

  private getCheckedSiteFilters(): string[] {
    const checkedInputs = document.querySelectorAll('input[id^="site-"]:checked');
    return Array.from(checkedInputs).map(input => {
      const id = (input as HTMLInputElement).id;
      return id.replace('site-', '');
    });
  }

  private getCheckedZoneFilters(): string[] {
    const checkedInputs = document.querySelectorAll('input[id^="zone-"]:checked');
    return Array.from(checkedInputs).map(input => {
      const id = (input as HTMLInputElement).id;
      return id.replace('zone-', '');
    });
  }

  // Additional utility methods for better filter management
  private updateCheckboxStates(): void {
    // Update site checkboxes based on internal state
    this.siteFilters.forEach(filter => {
      const checkbox = document.getElementById(`site-${filter.value}`) as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = filter.checked;
      }
    });

    // Update zone checkboxes based on internal state
    this.zoneFilters.forEach(filter => {
      const checkbox = document.getElementById(`zone-${filter.value}`) as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = filter.checked;
      }
    });
  }

  private syncFiltersWithUI(): void {
    // Sync site filters with UI state
    this.siteFilters.forEach(filter => {
      const checkbox = document.getElementById(`site-${filter.value}`) as HTMLInputElement;
      if (checkbox) {
        filter.checked = checkbox.checked;
      }
    });

    // Sync zone filters with UI state
    this.zoneFilters.forEach(filter => {
      const checkbox = document.getElementById(`zone-${filter.value}`) as HTMLInputElement;
      if (checkbox) {
        filter.checked = checkbox.checked;
      }
    });
  }

  // Advanced filtering methods
  private filterByBounds(bounds?: any): void {
    if (!bounds) return;

    const filteredFeatures = this.allFeatures.filter(feature => {
      const geometry = feature.getGeometry();
      if (!geometry) return false;

      const extent = geometry.getExtent();
      // Check if feature intersects with bounds
      return bounds.intersects(extent);
    });

    this.actifVectorSource.clear();
    this.actifVectorSource.addFeatures(filteredFeatures);
  }

  private filterByDistance(centerPoint: any, radius: number): void {
    if (!centerPoint || radius <= 0) return;

    const filteredFeatures = this.allFeatures.filter(feature => {
      const geometry = feature.getGeometry();
      if (!geometry) return false;

      // Calculate distance from center point
      // This is a simplified distance calculation
      const featureCoords = geometry.getFirstCoordinate();
      const distance = Math.sqrt(
        Math.pow(featureCoords[0] - centerPoint[0], 2) + 
        Math.pow(featureCoords[1] - centerPoint[1], 2)
      );

      return distance <= radius;
    });

    this.actifVectorSource.clear();
    this.actifVectorSource.addFeatures(filteredFeatures);
  }

  // Batch operations for performance
  private batchUpdateFilters(updates: {
    sites?: string[];
    zones?: string[];
    etats?: string[];
  }): void {
    if (updates.sites) {
      this.siteFilters.forEach(filter => {
        filter.checked = updates.sites!.includes(filter.value);
      });
    }

    if (updates.zones) {
      this.zoneFilters.forEach(filter => {
        filter.checked = updates.zones!.includes(filter.value);
      });
    }

    if (updates.etats) {
      this.etatChips.forEach(chip => {
        chip.selected = updates.etats!.includes(chip.value);
      });
    }

    // Update UI and apply filters
    this.updateCheckboxStates();
    const filterPanel = document.querySelector('.floating-filter-panel') as HTMLElement;
    if (filterPanel) {
      this.updateFilterPanelDisplay(filterPanel);
    }
    this.applyFilters();
  }

  // Export/Import filter states for user preferences
  private exportFilterState(): any {
    return {
      sites: this.siteFilters.filter(f => f.checked).map(f => f.value),
      zones: this.zoneFilters.filter(f => f.checked).map(f => f.value),
      etats: this.etatChips.filter(c => c.selected).map(c => c.value),
      baseMap: this.selectedBaseMap,
      legendVisible: this.isLegendVisible
    };
  }

  private importFilterState(state: any): void {
    if (!state) return;

    if (state.sites) {
      this.siteFilters.forEach(filter => {
        filter.checked = state.sites.includes(filter.value);
      });
    }

    if (state.zones) {
      this.zoneFilters.forEach(filter => {
        filter.checked = state.zones.includes(filter.value);
      });
    }

    if (state.etats) {
      this.etatChips.forEach(chip => {
        chip.selected = state.etats.includes(chip.value);
      });
    }

    if (state.baseMap) {
      this.switchBaseMap(state.baseMap);
    }

    if (typeof state.legendVisible === 'boolean' && state.legendVisible !== this.isLegendVisible) {
      this.toggleLegend();
    }

    // Update UI
    this.updateCheckboxStates();
    const filterPanel = document.querySelector('.floating-filter-panel') as HTMLElement;
    if (filterPanel) {
      this.updateFilterPanelDisplay(filterPanel);
    }
    this.applyFilters();
  }

  // Performance optimization for large datasets
  private debounceFilter = this.debounce(() => {
    this.applyFilters();
  }, 300);

  private debounce(func: Function, wait: number): Function {
    let timeout: any;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

}