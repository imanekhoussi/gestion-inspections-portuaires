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
import LayerSwitcher from 'ol-ext/control/LayerSwitcher';
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
    CdkDrag,
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
  
  // Selected actif
  selectedActifId: number | null = null;
  selectedActif: Actif | null = null;
  
  // UI State
  isLegendVisible = false;
  isFilterPanelVisible = true;
  
  // Filter data
  siteFilters: FilterOption[] = [];
  zoneFilters: FilterOption[] = [];
  etatChips: EtatChip[] = [
    { value: '1-2', label: 'Bon état', count: 0, selected: true, color: '#4caf50' },
    { value: '3', label: 'Moyen', count: 0, selected: true, color: '#ff9800' },
    { value: '4-5', label: 'Mauvais', count: 0, selected: true, color: '#f44336' }
  ];
  
  selectedBaseMap = 'osm';
  
  private readonly DEFAULT_COORDS: [number, number] = [-5.50308, 35.88187];
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
      layers: [this.osmLayer, this.satelliteLayer],
      properties: { title: 'Fonds de carte' }
    });

    this.actifLayer = new VectorLayer({
      source: this.actifVectorSource,
      properties: { title: 'Actifs Portuaires' },
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
    // to activate the fullscreen control
    this.map.addControl(new FullScreen());
  
    this.map.on('singleclick', (event) => this.handleMapClick(event));
    this.setupPopupCloser();
  }

 

  private setupPopupCloser(): void {
    const closer = this.popupElementRef.nativeElement.querySelector('.ol-popup-closer');
    if (closer) {
      closer.onclick = () => {
        this.popupOverlay.setPosition(undefined);
        return false;
      };
    }
  }

  private getFeatureStyle(feature: any): Style {
    const indice = feature.get('indiceEtat') || 1;
    const isSelected = feature.get('isSelected') || false;
    const geometryType = feature.getGeometry()?.getType();
    
    if (!this.isLegendVisible && !isSelected) {
      return this.getUniformStyle(geometryType);
    }

    const color = this.getColorByIndice(indice);
    
    if (geometryType === 'LineString') {
      return new Style({
        stroke: new Stroke({ 
          color: isSelected ? '#2196f3' : color, 
          width: isSelected ? 6 : 4
        }),
        text: new Text({
          text: isSelected ? `🎯 ${indice}` : indice.toString(),
          fill: new Fill({ color: isSelected ? '#2196f3' : color }),
          font: isSelected ? 'bold 16px sans-serif' : 'bold 12px sans-serif',
          stroke: new Stroke({ color: 'white', width: 2 })
        })
      });
    } else if (geometryType === 'Polygon') {
      return new Style({
        fill: new Fill({ color: isSelected ? 'rgba(33, 150, 243, 0.3)' : `${color}40` }),
        stroke: new Stroke({ color: isSelected ? '#2196f3' : color, width: isSelected ? 4 : 2 }),
        text: new Text({
          text: isSelected ? `🎯 ${indice}` : indice.toString(),
          fill: new Fill({ color: isSelected ? '#2196f3' : color }),
          font: isSelected ? 'bold 16px sans-serif' : 'bold 12px sans-serif',
          stroke: new Stroke({ color: 'white', width: 2 })
        })
      });
    } else {
      return new Style({
        image: new Circle({
          radius: isSelected ? 15 : 10,
          fill: new Fill({ color: isSelected ? '#2196f3' : color }),
          stroke: new Stroke({ color: 'white', width: isSelected ? 4 : 2 })
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
    const uniformColor = '#607d8b';
    
    if (geometryType === 'LineString') {
      return new Style({
        stroke: new Stroke({ color: uniformColor, width: 3 })
      });
    } else if (geometryType === 'Polygon') {
      return new Style({
        fill: new Fill({ color: `${uniformColor}40` }),
        stroke: new Stroke({ color: uniformColor, width: 2 })
      });
    } else {
      return new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: uniformColor }),
          stroke: new Stroke({ color: 'white', width: 2 })
        })
      });
    }
  }

  private getColorByIndice(indice: number): string {
    if (indice <= 2) return '#4caf50';
    if (indice === 3) return '#ff9800';
    return '#f44336';
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
          
          this.snackBar.open(`${features.length} actifs chargés`, 'Fermer', { duration: 3000 });
        } catch (error) {
          this.error = 'Erreur lors de l\'analyse des données';
          this.snackBar.open('Erreur de données', 'Fermer', { duration: 5000 });
        } finally {
          this.isLoading = false;
        }
      },
      error: () => {
        this.error = 'Erreur lors du chargement';
        this.isLoading = false;
        this.snackBar.open('Erreur de chargement', 'Fermer', { duration: 5000 });
      }
    });
  }

  private loadSpecificActif(actifId: number): void {
    this.isLoading = true;
    this.actifsService.getActifById(actifId).subscribe({
      next: (actif) => {
        this.selectedActif = actif;
        this.displaySingleActif(actif);
      },
      error: () => {
        this.error = 'Actif non trouvé';
        this.isLoading = false;
        this.snackBar.open('Actif non trouvé', 'Fermer', { duration: 5000 });
      }
    });
  }

  private displaySingleActif(actif: Actif): void {
    this.actifVectorSource.clear();

    if (actif.geometry?.coordinates) {
      const feature = this.createActifFeature(actif);
      this.actifVectorSource.addFeature(feature);
      
      const geometry = feature.getGeometry();
      if (geometry) {
        this.map.getView().fit(geometry.getExtent(), {
          padding: [100, 100, 100, 100],
          maxZoom: 18,
          duration: 1500
        });
      }
    }
    this.isLoading = false;
  }

  private createActifFeature(actif: Actif): Feature {
    return new GeoJSON().readFeature({
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
    }, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    }) as Feature;
  }

  private generateFilterOptions(): void {
    const sites: Record<string, number> = {};
    const zones: Record<string, number> = {};
    const etats: Record<string, number> = {};

    this.allFeatures.forEach(feature => {
      const props = feature.getProperties();
      
      if (props.site) sites[props.site] = (sites[props.site] || 0) + 1;
      if (props.zone) zones[props.zone] = (zones[props.zone] || 0) + 1;
      
      const indice = props.indiceEtat || 1;
      const etatKey = indice <= 2 ? '1-2' : indice === 3 ? '3' : '4-5';
      etats[etatKey] = (etats[etatKey] || 0) + 1;
    });

    this.siteFilters = Object.entries(sites).map(([site, count]) => ({
      value: site, label: site, count, checked: true
    }));

    this.zoneFilters = Object.entries(zones).map(([zone, count]) => ({
      value: zone, label: zone, count, checked: true
    }));

    this.etatChips.forEach(chip => {
      chip.count = etats[chip.value] || 0;
    });
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
    const { nom, site, zone, indiceEtat, id, code } = props;
    const statusClass = indiceEtat <= 2 ? 'status-good' : indiceEtat === 3 ? 'status-average' : 'status-poor';
    const statusText = indiceEtat <= 2 ? 'Bon état' : indiceEtat === 3 ? 'État moyen' : 'Mauvais état';
    const isSelected = this.selectedActif?.id === id;

    return `
      ${isSelected ? '<div class="selected-badge">📍 Actif sélectionné</div>' : ''}
      <h3 class="popup-title">${nom || 'Actif sans nom'}</h3>
      <div class="popup-details">
        <div class="detail-item"><strong>Code:</strong> ${code || 'N/A'}</div>
        <div class="detail-item"><strong>Site:</strong> ${site || 'Non spécifié'}</div>
        <div class="detail-item"><strong>Zone:</strong> ${zone || 'Non spécifiée'}</div>
        <div class="detail-item">
          <strong>État:</strong> 
          <span class="status-badge ${statusClass}">${statusText} (${indiceEtat || 'N/A'}/5)</span>
        </div>
      </div>
    `;
  }

  // Public methods for template
  toggleLegend(): void {
    this.isLegendVisible = !this.isLegendVisible;
    this.actifLayer.getSource()?.changed();
    this.snackBar.open(
      this.isLegendVisible ? 'Légende activée' : 'Légende désactivée', 
      'Fermer', 
      { duration: 2000 }
    );
  }

  toggleFilterPanel(): void {
    this.isFilterPanelVisible = !this.isFilterPanelVisible;
  }

  onChipToggle(chipValue: string): void {
    const chip = this.etatChips.find(c => c.value === chipValue);
    if (chip) {
      chip.selected = !chip.selected;
      this.applyFilters();
    }
  }

  onLegendItemClick(chipValue: string): void {
    this.onChipToggle(chipValue);
  }

  onSiteFilterChange(): void {
    this.applyFilters();
  }

  onZoneFilterChange(): void {
    this.applyFilters();
  }

  onBaseMapChange(): void {
    if (this.selectedBaseMap === 'satellite') {
      this.osmLayer.setVisible(false);
      this.satelliteLayer.setVisible(true);
    } else {
      this.osmLayer.setVisible(true);
      this.satelliteLayer.setVisible(false);
    }
  }



  private applyFilters(): void {
    const checkedSites = this.siteFilters.filter(f => f.checked).map(f => f.value);
    const checkedZones = this.zoneFilters.filter(f => f.checked).map(f => f.value);
    const selectedEtats = this.etatChips.filter(c => c.selected).map(c => c.value);

    const filteredFeatures = this.allFeatures.filter(feature => {
      const props = feature.getProperties();
      
      if (checkedSites.length && !checkedSites.includes(props.site)) return false;
      if (checkedZones.length && !checkedZones.includes(props.zone)) return false;
      
      const indice = props.indiceEtat || 1;
      const etatKey = indice <= 2 ? '1-2' : indice === 3 ? '3' : '4-5';
      if (!selectedEtats.includes(etatKey)) return false;
      
      return true;
    });

    this.actifVectorSource.clear();
    this.actifVectorSource.addFeatures(filteredFeatures);
    this.snackBar.open(`${filteredFeatures.length} actifs affichés`, 'Fermer', { duration: 2000 });
  }

  goBackToList(): void {
    this.router.navigate(['/actifs/list']);
  }

  centerOnTanger(): void {
    this.map.getView().animate({
      center: fromLonLat(this.DEFAULT_COORDS),
      zoom: this.DEFAULT_ZOOM,
      duration: 1000
    });
  }

  refreshData(): void {
    if (this.selectedActifId) {
      this.loadSpecificActif(this.selectedActifId);
    } else {
      this.loadActifs();
    }
  }

  zoomToActifs(): void {
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