import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
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
import { CdkDrag } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { ActifsService } from '../../services/actifs.service';
import { ActifGeoJSON, Actif } from '../../../../core/models/actif.interface';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

// OpenLayers imports
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
import FullScreen from 'ol/control/FullScreen';
import Feature from 'ol/Feature';

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

@Component({
  selector: 'app-actifs-map',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatSnackBarModule, MatSelectModule, MatCheckboxModule, MatFormFieldModule,
    MatExpansionModule, MatChipsModule, CdkDrag, FormsModule, LoadingSpinnerComponent
  ],
  templateUrl: './actifs-map.component.html',
  styleUrls: ['./actifs-map.component.scss']
})
export class ActifsMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('popup') popupElementRef!: ElementRef;
  @ViewChild('popupContent') popupContentElementRef!: ElementRef;
  @ViewChild('mapWrapper') mapWrapperRef!: ElementRef;

  private map!: Map;
  private actifVectorSource = new VectorSource();
  private actifLayer!: VectorLayer<VectorSource>;
  private popupOverlay!: Overlay;
  private osmLayer!: TileLayer<OSM>;
  private satelliteLayer!: TileLayer<XYZ>;
  private allFeatures: any[] = [];

  isLoading = true;
  error: string | null = null;
  selectedActifId: number | null = null;
  selectedActif: Actif | null = null;
  isLegendVisible = false;
  isFilterPanelVisible = true;

  siteFilters: FilterOption[] = [];
  zoneFilters: FilterOption[] = [];
  etatChips: EtatChip[] = [
    { value: '1-2', label: 'Bon état', count: 0, selected: true, color: '#4caf50' },
    { value: '3', label: 'Moyen', count: 0, selected: true, color: '#ff9800' },
    { value: '4-5', label: 'Mauvais', count: 0, selected: true, color: '#f44336' }
  ];
  selectedBaseMap = 'osm';

  // This variable will hold the selector for the drag boundary
  dragBoundarySelector: string = '.map-wrapper';

  private readonly DEFAULT_COORDS: [number, number] = [-5.50308, 35.88187];
  private readonly DEFAULT_ZOOM = 13;

  constructor(
    private actifsService: ActifsService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.selectedActifId = params['actifId'] ? +params['actifId'] : null;
      this.loadData();
    });
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.setTarget(undefined);
    }
  }

  private initializeMap(): void {
    this.osmLayer = new TileLayer({
      source: new OSM(),
      properties: { title: 'OpenStreetMap', baseLayer: true }
    });

    this.satelliteLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: 'Tiles © Esri'
      }),
      properties: { title: 'Satellite', baseLayer: true },
      visible: false
    });

    const baseLayers = new LayerGroup({
      layers: [this.osmLayer, this.satelliteLayer]
    });

    this.actifLayer = new VectorLayer({
      source: this.actifVectorSource,
      style: (feature) => this.getFeatureStyle(feature)
    });

    this.popupOverlay = new Overlay({
      element: this.popupElementRef.nativeElement,
      autoPan: { animation: { duration: 250 } }
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

    // --- ROBUST FULLSCREEN LOGIC ---
    const fullScreenControl = new FullScreen();

    fullScreenControl.on('enterfullscreen', () => {
      this.dragBoundarySelector = 'body'; // Remove boundary for fullscreen
      this.cdr.detectChanges();
    });

    fullScreenControl.on('leavefullscreen', () => {
      this.dragBoundarySelector = '.map-wrapper'; // Restore boundary
      this.cdr.detectChanges();
    });

    this.map.addControl(fullScreenControl);
    // --- END OF LOGIC ---

    this.map.on('singleclick', (event) => this.handleMapClick(event));
    this.setupPopupCloser();
  }

  private setupPopupCloser(): void {
    const closer = this.popupElementRef.nativeElement.querySelector('.ol-popup-closer');
    closer.onclick = () => {
      this.popupOverlay.setPosition(undefined);
      return false;
    };
  }

  private loadData(): void {
    if (this.selectedActifId) {
      this.loadSpecificActif(this.selectedActifId);
    } else {
      this.loadActifs();
    }
  }

  private loadActifs(): void {
    this.isLoading = true;
    this.error = null;
    this.actifVectorSource.clear();

    this.actifsService.getActifsGeoJSON().subscribe({
      next: (geoJson) => {
        const features = new GeoJSON().readFeatures(geoJson, { featureProjection: 'EPSG:3857' });
        this.allFeatures = features;
        this.generateFilterOptions();
        this.applyFilters(); // Apply default filters on load
        this.snackBar.open(`${features.length} actifs chargés`, 'Fermer', { duration: 3000 });
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Erreur lors du chargement des actifs.';
        this.isLoading = false;
      }
    });
  }

  private loadSpecificActif(actifId: number): void {
    this.isLoading = true;
    this.error = null;
    this.actifsService.getActifById(actifId).subscribe({
      next: (actif) => {
        this.selectedActif = actif;
        this.displaySingleActif(actif);
        this.isLoading = false;
      },
      error: () => {
        this.error = `L'actif avec l'ID ${actifId} n'a pas été trouvé.`;
        this.isLoading = false;
      }
    });
  }

private displaySingleActif(actif: Actif): void {
  console.log('🗺️ === DEBUT displaySingleActif ===');
  console.log('📦 Actif reçu:', actif);
  console.log('🔍 Type actif:', typeof actif);
  console.log('🗺️ Actif.geometry:', actif.geometry);
  console.log('🔍 Type geometry:', typeof actif.geometry);
  
  try {
    // Nettoyer la source vectorielle
    this.actifVectorSource.clear();
    console.log('🧹 Source vectorielle nettoyée');
    
    // Vérifier si l'actif a une géométrie
    if (!actif.geometry?.coordinates) {
      console.warn('⚠️ Actif sans géométrie valide');
      console.log('📋 Actif complet:', JSON.stringify(actif, null, 2));
      return;
    }

    console.log('✅ Géométrie valide détectée');
    console.log('🔍 Coordonnées:', actif.geometry.coordinates);
    console.log('🔧 Type géométrie:', actif.geometry.type);

    // Essayer de créer la feature avec debugging
    console.log('🔄 Tentative de création de feature...');
    
    // Méthode directe sans passer par createActifFeature
    const geoJsonFormat = new GeoJSON();
    
    const geoJsonFeature = {
      type: 'Feature',
      geometry: actif.geometry,
      properties: { 
        id: actif.id,
        nom: actif.nom,
        code: actif.code,
        site: actif.site,
        zone: actif.zone,
        indiceEtat: actif.indiceEtat,
        isSelected: true
      }
    };
    
    console.log('🔍 GeoJSON Feature créée:', geoJsonFeature);
    
    // Fix: Handle the return type properly - readFeature can return Feature or Feature[]
    const featureResult = geoJsonFormat.readFeature(geoJsonFeature, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });
    
    // Ensure we have a single Feature
    const feature = Array.isArray(featureResult) ? featureResult[0] : featureResult;
    
    if (!feature) {
      console.error('❌ Aucune feature créée');
      return;
    }
    
    console.log('✅ Feature OpenLayers créée:', feature);
    console.log('🔍 Feature geometry:', feature.getGeometry());
    console.log('🔍 Feature geometry type:', feature.getGeometry()?.getType());
    
    // Vérifier que la géométrie est valide avant d'ajouter
    const geometry = feature.getGeometry();
    if (!geometry) {
      console.error('❌ Pas de géométrie dans la feature');
      return;
    }
    
    console.log('🔄 Ajout de la feature à la source...');
    this.actifVectorSource.addFeature(feature);
    console.log('✅ Feature ajoutée avec succès');
    
    // Centrer sur la géométrie
    console.log('🔄 Centrage sur la géométrie...');
    const extent = geometry.getExtent();
    console.log('🔍 Extent:', extent);
    
    this.map.getView().fit(extent, {
      padding: [100, 100, 100, 100],
      maxZoom: 18,
      duration: 1500
    });
    
    console.log('✅ === FIN displaySingleActif SUCCÈS ===');
    
  } catch (error: any) { // Fix: Explicitly type error as 'any'
    console.error('❌ === ERREUR displaySingleActif ===');
    console.error('📋 Erreur:', error);
    console.error('📋 Stack:', error?.stack); // Fix: Use optional chaining
    console.error('📋 Actif problématique:', JSON.stringify(actif, null, 2));
    
    // Tentative de fallback simple
    console.log('🔄 Tentative de fallback...');
    try {
      this.fallbackDisplayActif(actif);
    } catch (fallbackError: any) { // Fix: Explicitly type fallbackError as 'any'
      console.error('❌ Fallback aussi échoué:', fallbackError);
    }
  }
}

private fallbackDisplayActif(actif: Actif): void {
  if (!actif.geometry) return;
  
  console.log('🔄 Fallback: création manuelle de feature');
  
  // Créer une feature très simple
  const feature = new Feature();
  
  // Essayer de créer la géométrie manuellement
  const geoJsonFormat = new GeoJSON();
  const geometryResult = geoJsonFormat.readGeometry(actif.geometry, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857'
  });
  
  // Handle potential array return (though readGeometry typically returns single geometry)
  const geometry = Array.isArray(geometryResult) ? geometryResult[0] : geometryResult;
  
  if (!geometry) {
    console.error('❌ Impossible de créer la géométrie');
    return;
  }
  
  feature.setGeometry(geometry);
  feature.setProperties({
    id: actif.id,
    nom: actif.nom,
    isSelected: true
  });
  
  this.actifVectorSource.addFeature(feature);
  
  // Centrer
  const extent = geometry.getExtent();
  this.map.getView().fit(extent, {
    padding: [100, 100, 100, 100],
    maxZoom: 18,
    duration: 1500
  });
  
  console.log('✅ Fallback réussi');
}

  private createActifFeature(actif: Actif): Feature {
    return new GeoJSON().readFeature({
      type: 'Feature',
      geometry: actif.geometry,
      properties: { ...actif, isSelected: true }
    }, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    }) as Feature;
  }

  private generateFilterOptions(): void {
    const sites: Record<string, number> = {};
    const zones: Record<string, number> = {};
    const etats: Record<string, number> = { '1-2': 0, '3': 0, '4-5': 0 };

    this.allFeatures.forEach(feature => {
      const props = feature.getProperties();
      if (props.site) sites[props.site] = (sites[props.site] || 0) + 1;
      if (props.zone) zones[props.zone] = (zones[props.zone] || 0) + 1;

      const indice = props.indiceEtat || 1;
      const etatKey = indice <= 2 ? '1-2' : indice === 3 ? '3' : '4-5';
      etats[etatKey]++;
    });

    this.siteFilters = Object.entries(sites).map(([site, count]) => ({ value: site, label: site, count, checked: true }));
    this.zoneFilters = Object.entries(zones).map(([zone, count]) => ({ value: zone, label: zone, count, checked: true }));
    this.etatChips.forEach(chip => chip.count = etats[chip.value] || 0);
  }

  private applyFilters(): void {
    const checkedSites = this.siteFilters.filter(f => f.checked).map(f => f.value);
    const checkedZones = this.zoneFilters.filter(f => f.checked).map(f => f.value);
    const selectedEtats = this.etatChips.filter(c => c.selected).map(c => c.value);

    const filteredFeatures = this.allFeatures.filter(feature => {
      const props = feature.getProperties();
      if (!checkedSites.includes(props.site)) return false;
      if (!checkedZones.includes(props.zone)) return false;
      const indice = props.indiceEtat || 1;
      const etatKey = indice <= 2 ? '1-2' : indice === 3 ? '3' : '4-5';
      if (!selectedEtats.includes(etatKey)) return false;
      return true;
    });

    this.actifVectorSource.clear();
    this.actifVectorSource.addFeatures(filteredFeatures);
    this.snackBar.open(`${filteredFeatures.length} actifs affichés`, 'Fermer', { duration: 2000 });
  }

  

  private getColorByIndice(indice: number): string {
    if (indice <= 2) return '#4caf50'; // Green
    if (indice === 3) return '#ff9800'; // Orange
    return '#f44336'; // Red
  }

  private handleMapClick(event: any): void {
    this.popupOverlay.setPosition(undefined);
    this.map.forEachFeatureAtPixel(event.pixel, (feature) => {
      const props = feature.getProperties();
      this.popupContentElementRef.nativeElement.innerHTML = this.createPopupContent(props);
      this.popupOverlay.setPosition(event.coordinate);
      return true;
    });
  }

  private createPopupContent(props: any): string {
    const { nom, code, site, zone, indiceEtat } = props;
    const statusClass = indiceEtat <= 2 ? 'status-good' : indiceEtat === 3 ? 'status-average' : 'status-poor';
    const statusText = indiceEtat <= 2 ? 'Bon état' : indiceEtat === 3 ? 'État moyen' : 'Mauvais état';

    return `
      <h3 class="popup-title">${nom || 'Actif sans nom'}</h3>
      <div class="popup-details">
        <div class="detail-item"><strong>Code:</strong> ${code || 'N/A'}</div>
        <div class="detail-item"><strong>Site:</strong> ${site || 'N/A'}</div>
        <div class="detail-item"><strong>Zone:</strong> ${zone || 'N/A'}</div>
        <div class="detail-item">
          <strong>État:</strong>
          <span class="status-badge ${statusClass}">${statusText} (${indiceEtat || 'N/A'}/5)</span>
        </div>
      </div>
    `;
  }

// actifs-map.component.ts

private getFeatureStyle(feature: any): Style {
  const isSelected = feature.get('isSelected') || false;

  // Rule 1: If legend is hidden, use a neutral gray style for ALL geometry types
  if (!this.isLegendVisible && !isSelected) {
    const neutralColor = '#888888'; // Neutral gray
    const neutralFillColor = 'rgba(136, 136, 136, 0.3)'; // Gray with 30% opacity

    return new Style({
      // For Points
      image: new Circle({
        radius: 7,
        fill: new Fill({ color: neutralColor }),
        stroke: new Stroke({ color: 'white', width: 2 }),
      }),
      // For Lines and Polygon outlines
      stroke: new Stroke({
        color: neutralColor,
        width: 3,
      }),
      // For Polygon interiors
      fill: new Fill({
        color: neutralFillColor,
      }),
    });
  }

  // Rule 2: If legend IS visible, use the detailed, colored style
  const indice = feature.get('indiceEtat') || 1;
  const color = this.getColorByIndice(indice);
  const radius = isSelected ? 12 : 8;
  const strokeWidth = isSelected ? 3 : 2;

  return new Style({
    // For Points
    image: new Circle({
      radius: radius,
      fill: new Fill({ color: color }),
      stroke: new Stroke({ color: 'white', width: strokeWidth }),
    }),
    // For Lines and Polygon outlines
    stroke: new Stroke({
      color: color,
      width: strokeWidth + 2,
    }),
    // For Polygon interiors
    fill: new Fill({
      color: `${color}40`, // Adds ~25% opacity to the color
    }),
    // For Point text (only shows when legend is visible)
    text: new Text({
      text: indice.toString(),
      font: `bold ${isSelected ? '12px' : '10px'} sans-serif`,
      fill: new Fill({ color: 'white' }),
    }),
  });
}

toggleLegend(): void {
  this.isLegendVisible = !this.isLegendVisible;
  
  // This command forces the map to redraw everything
  if (this.actifVectorSource) {
    this.actifVectorSource.changed();
  }
}
  toggleFilterPanel(): void { this.isFilterPanelVisible = !this.isFilterPanelVisible; }
  onFilterChange(): void { this.applyFilters(); }

  onChipToggle(chipValue: string): void {
    const chip = this.etatChips.find(c => c.value === chipValue);
    if (chip) chip.selected = !chip.selected;
    this.applyFilters();
  }

  onBaseMapChange(): void {
    this.satelliteLayer.setVisible(this.selectedBaseMap === 'satellite');
    this.osmLayer.setVisible(this.selectedBaseMap !== 'satellite');
  }

  goBackToList(): void { this.router.navigate(['/actifs/map']); }
  refreshData(): void { this.loadData(); }

  centerOnTanger(): void {
    this.map.getView().animate({
      center: fromLonLat(this.DEFAULT_COORDS),
      zoom: this.DEFAULT_ZOOM,
      duration: 1000
    });
  }

  zoomToActifs(): void {
    if (this.actifVectorSource.getFeatures().length > 0) {
      this.map.getView().fit(this.actifVectorSource.getExtent(), {
        padding: [50, 50, 50, 50],
        duration: 1000,
        maxZoom: 16
      });
    }
  }
}
