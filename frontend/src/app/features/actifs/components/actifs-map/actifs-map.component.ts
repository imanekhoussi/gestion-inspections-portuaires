import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router'; // ← AJOUTER
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
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
  
  // 🔥 NOUVEAU: Pour gérer un actif spécifique
  selectedActifId: number | null = null;
  selectedActif: Actif | null = null;
  
  // Filter options
  siteFilters: FilterOption[] = [];
  zoneFilters: FilterOption[] = [];
  etatFilters: FilterOption[] = [
    { value: '1-2', label: 'Bon état (1-2)', count: 0, checked: true },
    { value: '3', label: 'État moyen (3)', count: 0, checked: true },
    { value: '4-5', label: 'Mauvais état (4-5)', count: 0, checked: true }
  ];
  
  // Base map selection
  selectedBaseMap = 'osm';
  
  // Coordinates are [longitude, latitude] for OpenLayers
  private readonly DEFAULT_COORDS: [number, number] = [-5.8340, 35.7595];
  private readonly DEFAULT_ZOOM = 13;

  constructor(
    private actifsService: ActifsService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute, // ← AJOUTER
    private router: Router // ← AJOUTER
  ) {}

  ngOnInit(): void {
    // 🔥 NOUVEAU: Écouter les paramètres de l'URL
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
  }

  ngOnDestroy(): void {
    // Remove custom legend and filter panel
    const legendElement = document.querySelector('.ol-legend-custom');
    if (legendElement) {
      legendElement.remove();
    }
    
    const filterPanel = document.querySelector('.ol-filter-panel');
    if (filterPanel) {
      filterPanel.remove();
    }
    
    if (this.map) {
      this.map.setTarget(undefined);
    }
  }

  // 🔥 NOUVELLE MÉTHODE: Charger un actif spécifique
  private loadSpecificActif(actifId: number): void {
    this.isLoading = true;
    this.error = null;

    // Charger les détails de l'actif
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

  // 🔥 NOUVELLE MÉTHODE: Afficher un seul actif
  private displaySingleActif(actif: Actif): void {
  this.actifVectorSource.clear();

  if (actif.geometry && actif.geometry.coordinates) {
    // Créer une feature pour cet actif
    const feature = this.createActifFeature(actif);
    this.actifVectorSource.addFeature(feature);

    // Zoomer sur cet actif avec padding adapté au type
    const geometry = feature.getGeometry();
    if (geometry) {
      const geometryType = actif.geometry.type;
      let padding = [100, 100, 100, 100];
      let maxZoom = 18;

      // 🔥 ADAPTER le zoom selon le type de géométrie
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
      geometryType: actif.geometry?.type// Marquer comme sélectionné
    }
  }, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857'
  });

  // S'assurer qu'on retourne un seul Feature
  if (Array.isArray(featureOrFeatures)) {
    return featureOrFeatures[0];
  }
  return featureOrFeatures;
}

  public goBackToList(): void {
  this.router.navigate(['/actifs/list']);
}

  private getStyleByIndice(indice: number, isSelected: boolean = false, geometryType?: string): Style {
  let color: string;
  let textColor = 'white';
  
  if (indice <= 2) {
    color = '#4caf50'; // Green - Good state
  } else if (indice === 3) {
    color = '#ff9800'; // Orange - Average state  
  } else {
    color = '#f44336'; // Red - Poor state
  }

  // 🔥 NOUVEAU: Style différent selon le type de géométrie
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
        color: isSelected ? 'rgba(33, 150, 243, 0.3)' : `${color}40` // 40 = 25% opacity
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
  
  else { // Point par défaut
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

  private initializeMap(): void {
    // Base layers
    this.osmLayer = new TileLayer({
      source: new OSM(),
      properties: { title: 'OpenStreetMap', baseLayer: true }
    });

    this.satelliteLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: 'Tiles © Esri',
        maxZoom: 19
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
      const geometryType = geometry?.getType(); // 🔥 RÉCUPÉRER LE TYPE
      
      return this.getStyleByIndice(indice, isSelected, geometryType);
    }
  });

    // Create popup overlay
    this.popupOverlay = new Overlay({
      element: this.popupElementRef.nativeElement,
      autoPan: {
        animation: {
          duration: 250
        }
      }
    });
    
    // Initialize the map
    this.map = new Map({
      target: 'map',
      layers: [baseLayers, this.actifLayer],
      view: new View({
        center: fromLonLat(this.DEFAULT_COORDS),
        zoom: this.DEFAULT_ZOOM,
        maxZoom: 19,
        minZoom: 8
      }),
      overlays: [this.popupOverlay]
    });

    // Add controls after map is initialized
    this.addMapControls();

    // Handle map clicks for popups
    this.map.on('singleclick', (event) => {
      this.handleMapClick(event);
    });

    // Setup popup closer
    const closer = this.popupElementRef.nativeElement.querySelector('.ol-popup-closer');
    if (closer) {
      closer.onclick = () => {
        this.popupOverlay.setPosition(undefined);
        closer.blur();
        return false;
      };
    }
  }

  

  // 🔥 MODIFIER la méthode de création du popup pour l'actif sélectionné
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
    // Add layer switcher
    const layerSwitcher = new LayerSwitcher();
    this.map.addControl(layerSwitcher);

    // Add fullscreen control
    const fullScreen = new FullScreen();
    this.map.addControl(fullScreen);

    // Create custom legend and filter panel
    this.createCustomLegend();
    this.createFilterPanel();
  }

  private createCustomLegend(): void {
    const legendElement = document.createElement('div');
    legendElement.className = 'ol-legend-custom';
    legendElement.innerHTML = `
      <div class="legend-content">
        <h4>État des Actifs</h4>
        ${this.selectedActif ? `<div class="selected-actif-info">
          <strong>🎯 ${this.selectedActif.nom}</strong><br>
          <small>${this.selectedActif.code}</small>
        </div>` : ''}
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-symbol good-state"></div>
            <span>Bon état (1-2)</span>
          </div>
          <div class="legend-item">
            <div class="legend-symbol average-state"></div>
            <span>État moyen (3)</span>
          </div>
          <div class="legend-item">
            <div class="legend-symbol poor-state"></div>
            <span>Mauvais état (4-5)</span>
          </div>
          ${this.selectedActif ? `<div class="legend-item">
            <div class="legend-symbol selected-state"></div>
            <span>Actif sélectionné</span>
          </div>` : ''}
        </div>
        ${this.selectedActif ? `<button class="back-btn" onclick="window.location.href='/actifs/list'">
          ← Retour à la liste
        </button>` : ''}
      </div>
    `;

    const mapElement = document.getElementById('map');
    if (mapElement) {
      mapElement.appendChild(legendElement);
    }
  }

  private createFilterPanel(): void {
    // Masquer le panneau de filtres si on affiche un actif spécifique
    if (this.selectedActif) {
      return;
    }

    const filterElement = document.createElement('div');
    filterElement.className = 'ol-filter-panel';
    filterElement.innerHTML = `
      <div class="filter-header">
        <h4>🔍 Filtres</h4>
        <button class="collapse-btn">−</button>
      </div>
      <div class="filter-content">
        <div class="filter-section">
          <label>Fond de carte:</label>
          <select class="base-map-select">
            <option value="osm">OpenStreetMap</option>
            <option value="satellite">Satellite</option>
          </select>
        </div>
        
        <div class="filter-section">
          <label>Sites:</label>
          <div class="filter-checkboxes" id="site-filters"></div>
        </div>
        
        <div class="filter-section">
          <label>Zones:</label>
          <div class="filter-checkboxes" id="zone-filters"></div>
        </div>
        
        <div class="filter-section">
          <label>État:</label>
          <div class="filter-checkboxes" id="etat-filters"></div>
        </div>
        
        <div class="filter-actions">
          <button class="filter-btn reset-btn">Réinitialiser</button>
          <button class="filter-btn apply-btn">Appliquer</button>
        </div>
      </div>
    `;

    const mapElement = document.getElementById('map');
    if (mapElement) {
      mapElement.appendChild(filterElement);
      this.setupFilterEvents();
    }
  }

  private setupFilterEvents(): void {
    // Base map switcher
    const baseMapSelect = document.querySelector('.base-map-select') as HTMLSelectElement;
    if (baseMapSelect) {
      baseMapSelect.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        this.switchBaseMap(target.value);
      });
    }

    // Collapse/expand filter panel
    const collapseBtn = document.querySelector('.collapse-btn');
    const filterContent = document.querySelector('.filter-content') as HTMLElement;
    if (collapseBtn && filterContent) {
      collapseBtn.addEventListener('click', () => {
        const isCollapsed = filterContent.style.display === 'none';
        filterContent.style.display = isCollapsed ? 'block' : 'none';
        collapseBtn.textContent = isCollapsed ? '−' : '+';
      });
    }

    // Reset filters
    const resetBtn = document.querySelector('.reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetAllFilters();
      });
    }

    // Apply filters
    const applyBtn = document.querySelector('.apply-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        this.applyFilters();
      });
    }
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

  private handleMapClick(event: any): void {
    this.popupOverlay.setPosition(undefined);
    
    this.map.forEachFeatureAtPixel(event.pixel, (feature) => {
      const properties = feature.getProperties();
      this.popupContentElementRef.nativeElement.innerHTML = this.createPopupContent(properties);
      this.popupOverlay.setPosition(event.coordinate);
      return true;
    });
  }

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
            const extent = this.actifVectorSource.getExtent();
            this.map.getView().fit(extent, {
              padding: [50, 50, 50, 50],
              duration: 1000,
              maxZoom: 16
            });
            
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
      
      // Count sites
      if (props.site) {
        sites[props.site] = (sites[props.site] || 0) + 1;
      }
      
      // Count zones
      if (props.zone) {
        zones[props.zone] = (zones[props.zone] || 0) + 1;
      }
      
      // Count états
      const indice = props.indiceEtat || 1;
      let etatKey = '';
      if (indice <= 2) etatKey = '1-2';
      else if (indice === 3) etatKey = '3';
      else etatKey = '4-5';
      
      etats[etatKey] = (etats[etatKey] || 0) + 1;
    });

    // Generate site filters using Object.keys
    this.siteFilters = [];
    const siteKeys = Object.keys(sites);
    for (let i = 0; i < siteKeys.length; i++) {
      const site = siteKeys[i];
      this.siteFilters.push({
        value: site,
        label: site,
        count: sites[site],
        checked: true
      });
    }

    // Generate zone filters using Object.keys
    this.zoneFilters = [];
    const zoneKeys = Object.keys(zones);
    for (let i = 0; i < zoneKeys.length; i++) {
      const zone = zoneKeys[i];
      this.zoneFilters.push({
        value: zone,
        label: zone,
        count: zones[zone],
        checked: true
      });
    }

    // Update état filter counts
    for (let i = 0; i < this.etatFilters.length; i++) {
      const filter = this.etatFilters[i];
      filter.count = etats[filter.value] || 0;
    }

    this.populateFilterCheckboxes();
  }

  private populateFilterCheckboxes(): void {
    // Populate site filters
    const siteContainer = document.getElementById('site-filters');
    if (siteContainer) {
      let siteHtml = '';
      for (let i = 0; i < this.siteFilters.length; i++) {
        const filter = this.siteFilters[i];
        siteHtml += `
          <div class="filter-checkbox">
            <input type="checkbox" id="site-${filter.value}" ${filter.checked ? 'checked' : ''}>
            <label for="site-${filter.value}">${filter.label} (${filter.count})</label>
          </div>
        `;
      }
      siteContainer.innerHTML = siteHtml;
    }

    // Populate zone filters
    const zoneContainer = document.getElementById('zone-filters');
    if (zoneContainer) {
      let zoneHtml = '';
      for (let i = 0; i < this.zoneFilters.length; i++) {
        const filter = this.zoneFilters[i];
        zoneHtml += `
          <div class="filter-checkbox">
            <input type="checkbox" id="zone-${filter.value}" ${filter.checked ? 'checked' : ''}>
            <label for="zone-${filter.value}">${filter.label} (${filter.count})</label>
          </div>
        `;
      }
      zoneContainer.innerHTML = zoneHtml;
    }

    // Populate état filters
    const etatContainer = document.getElementById('etat-filters');
    if (etatContainer) {
      let etatHtml = '';
      for (let i = 0; i < this.etatFilters.length; i++) {
        const filter = this.etatFilters[i];
        etatHtml += `
          <div class="filter-checkbox">
            <input type="checkbox" id="etat-${filter.value}" ${filter.checked ? 'checked' : ''}>
            <label for="etat-${filter.value}">${filter.label} (${filter.count})</label>
          </div>
        `;
      }
      etatContainer.innerHTML = etatHtml;
    }
  }

  private resetAllFilters(): void {
    for (let i = 0; i < this.siteFilters.length; i++) {
      this.siteFilters[i].checked = true;
    }
    for (let i = 0; i < this.zoneFilters.length; i++) {
      this.zoneFilters[i].checked = true;
    }
    for (let i = 0; i < this.etatFilters.length; i++) {
      this.etatFilters[i].checked = true;
    }
    
    this.populateFilterCheckboxes();
    this.applyFilters();
  }

  private applyFilters(): void {
    // Get current checkbox states
    const checkedSites = this.getCheckedFilters('site');
    const checkedZones = this.getCheckedFilters('zone');
    const checkedEtats = this.getCheckedFilters('etat');

    // Filter features
    const filteredFeatures = this.allFeatures.filter(feature => {
      const props = feature.getProperties();
      
      // Check site filter
      if (checkedSites.length > 0 && !checkedSites.includes(props.site)) {
        return false;
      }
      
      // Check zone filter
      if (checkedZones.length > 0 && !checkedZones.includes(props.zone)) {
        return false;
      }
      
      // Check état filter
      const indice = props.indiceEtat || 1;
      let etatKey = '';
      if (indice <= 2) etatKey = '1-2';
      else if (indice === 3) etatKey = '3';
      else etatKey = '4-5';
      
      if (checkedEtats.length > 0 && !checkedEtats.includes(etatKey)) {
        return false;
      }
      
      return true;
    });

    // Update map
    this.actifVectorSource.clear();
    this.actifVectorSource.addFeatures(filteredFeatures);

    this.snackBar.open(`${filteredFeatures.length} actifs affichés`, 'Fermer', {
      duration: 2000
    });
  }

  private getCheckedFilters(type: string): string[] {
    const checkboxes = document.querySelectorAll(`input[id^="${type}-"]:checked`);
    const result: string[] = [];
    
    for (let i = 0; i < checkboxes.length; i++) {
      const checkbox = checkboxes[i] as HTMLInputElement;
      const value = checkbox.id.replace(`${type}-`, '');
      result.push(value);
    }
    
    return result;
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
}