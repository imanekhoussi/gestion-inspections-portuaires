// src/app/features/actifs/components/actif-map-dialog/actif-map-dialog.component.ts

import { Component, Inject, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { Actif } from '../../../../core/models/actif.interface';

// OpenLayers Imports
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { fromLonLat, transform } from 'ol/proj';
import { Style, Fill, Stroke, Circle, Icon } from 'ol/style';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import { Geometry } from 'ol/geom';

@Component({
  selector: 'app-actif-map-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule
  ],
  template: `
    <div class="map-dialog-header">
      <div class="header-content">
        <div class="actif-info">
          <mat-icon class="actif-icon">{{ getActifIcon() }}</mat-icon>
          <div class="actif-details">
            <h2>{{ actif.nom }}</h2>
            <p class="actif-code">{{ actif.code }}</p>
            <div class="actif-location">
              <mat-icon>location_on</mat-icon>
              <span>{{ actif.site }} - {{ actif.zone }}</span>
            </div>
          </div>
        </div>
        
        <div class="geometry-info">
          <mat-chip-listbox>
            <mat-chip [class]="'geometry-chip-' + actif.geometry?.type?.toLowerCase()">
              <mat-icon matChipAvatar>{{ getGeometryIcon() }}</mat-icon>
              {{ getGeometryLabel() }}
            </mat-chip>
          </mat-chip-listbox>
        </div>
      </div>
    </div>

    <div class="map-dialog-content">
      <div id="actif-map" class="map-container"></div>
      <div class="map-controls">
        <button mat-fab 
                class="control-button"
                (click)="zoomToActif()"
                matTooltip="Centrer sur l'actif">
          <mat-icon>center_focus_strong</mat-icon>
        </button>
        
        <button mat-fab 
                class="control-button"
                (click)="switchBaseMap()"
                [matTooltip]="isSatelliteView ? 'Vue plan' : 'Vue satellite'">
          <mat-icon>{{ isSatelliteView ? 'map' : 'satellite_alt' }}</mat-icon>
        </button>
        
        <button mat-fab 
                class="control-button"
                (click)="openInGoogleMaps()"
                matTooltip="Ouvrir dans Google Maps">
          <mat-icon>open_in_new</mat-icon>
        </button>
      </div>

      <div class="coordinates-info">
        <mat-icon>info</mat-icon>
        <span>{{ getCoordinatesText() }}</span>
      </div>
    </div>

    <div class="map-dialog-actions">
      <button mat-button (click)="close()">Fermer</button>
      <button mat-raised-button color="primary" (click)="close()">
        <mat-icon>check</mat-icon>
        OK
      </button>
    </div>
  `,
  styles: [`
    .map-dialog-header {
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
      color: white;
      padding: 24px;
      
      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 24px;
      }
      
      .actif-info {
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1;
        
        .actif-icon {
          width: 48px;
          height: 48px;
          font-size: 48px;
          background: rgba(255,255,255,0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .actif-details {
          h2 {
            margin: 0 0 4px 0;
            font-size: 1.5rem;
            font-weight: 600;
          }
          
          .actif-code {
            margin: 0 0 8px 0;
            opacity: 0.9;
            font-size: 0.9rem;
            font-family: 'Courier New', monospace;
          }
          
          .actif-location {
            display: flex;
            align-items: center;
            gap: 6px;
            opacity: 0.9;
            font-size: 0.9rem;
            
            mat-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
            }
          }
        }
      }
      
      .geometry-info {
        .geometry-chip-point {
          background: #4caf50 !important;
          color: white !important;
        }
        
        .geometry-chip-linestring {
          background: #ff9800 !important;
          color: white !important;
        }
        
        .geometry-chip-polygon {
          background: #9c27b0 !important;
          color: white !important;
        }
      }
    }

    .map-dialog-content {
      height: 500px;
      position: relative;
      overflow: hidden;
      
      .map-container {
        width: 100%;
        height: 100%;
        background: #f5f5f5;
      }
      
      .map-controls {
        position: absolute;
        bottom: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        
        .control-button {
          width: 48px;
          height: 48px;
          background: white;
          color: #374151;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border: 1px solid #e5e7eb;
          
          &:hover {
            background: #f9fafb;
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.2);
          }
        }
      }
      
      .coordinates-info {
        position: absolute;
        bottom: 20px;
        left: 20px;
        background: white;
        padding: 8px 12px;
        border-radius: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
        color: #374151;
        
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          color: #3b82f6;
        }
      }
    }

    .map-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    @media (max-width: 768px) {
      .map-dialog-header .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
      
      .map-dialog-content {
        height: 400px;
      }
    }
  `]
})
export class ActifMapDialogComponent implements AfterViewInit, OnDestroy {
  private map!: Map;
  private osmLayer!: TileLayer<OSM>;
  private satelliteLayer!: TileLayer<XYZ>;
  private actifLayer!: VectorLayer<VectorSource>;
  isSatelliteView = false;

  constructor(
    private dialogRef: MatDialogRef<ActifMapDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public actif: Actif
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.initializeMap(), 100);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.setTarget(undefined);
    }
  }

  private initializeMap(): void {
    this.createBaseLayers();
    this.createActifLayer();
    this.setupMap();
    this.addActifToMap();
    this.zoomToActif();
  }

  private createBaseLayers(): void {
    this.osmLayer = new TileLayer({
      source: new OSM(),
      visible: true
    });

    this.satelliteLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: 'Tiles © Esri',
        maxZoom: 19
      }),
      visible: false
    });
  }

  private createActifLayer(): void {
    const source = new VectorSource();
    
    this.actifLayer = new VectorLayer({
      source: source,
      style: this.getActifStyle()
    });
  }

  private getActifStyle(): Style {
    const geometryType = this.actif.geometry?.type;
    
    if (geometryType === 'Point') {
      return new Style({
        image: new Circle({
          radius: 12,
          fill: new Fill({ color: '#3b82f6' }),
          stroke: new Stroke({ color: '#ffffff', width: 3 })
        })
      });
    } else if (geometryType === 'LineString') {
      return new Style({
        stroke: new Stroke({ 
          color: '#ff9800', 
          width: 4,
          lineDash: [10, 5]
        })
      });
    } else if (geometryType === 'Polygon') {
      return new Style({
        fill: new Fill({ color: 'rgba(156, 39, 176, 0.2)' }),
        stroke: new Stroke({ color: '#9c27b0', width: 3 })
      });
    }
    
    return new Style();
  }

  private setupMap(): void {
    this.map = new Map({
      target: 'actif-map',
      layers: [this.osmLayer, this.satelliteLayer, this.actifLayer],
      view: new View({
        center: [0, 0],
        zoom: 2
      }),
      controls: []
    });
  }

  private addActifToMap(): void {
    if (!this.actif.geometry || !this.actif.geometry.coordinates) return;

    let geometry: Geometry;
    const coordinates = this.actif.geometry.coordinates;

    switch (this.actif.geometry.type) {
      case 'Point':
        const pointCoords = coordinates as [number, number];
        geometry = new Point(fromLonLat(pointCoords));
        break;
        
      case 'LineString':
        const lineCoords = coordinates as number[][];
        geometry = new LineString(lineCoords.map(coord => fromLonLat(coord)));
        break;
        
      case 'Polygon':
        const polygonCoords = coordinates as number[][][];
        geometry = new Polygon(polygonCoords.map(ring => 
          ring.map(coord => fromLonLat(coord))
        ));
        break;
        
      default:
        return;
    }

    const feature = new Feature({ geometry });
    this.actifLayer.getSource()?.addFeature(feature);
  }

  zoomToActif(): void {
    const source = this.actifLayer.getSource();
    if (source && source.getFeatures().length > 0) {
      const extent = source.getExtent();
      this.map.getView().fit(extent, {
        padding: [50, 50, 50, 50],
        maxZoom: 18,
        duration: 1000
      });
    }
  }

  switchBaseMap(): void {
    this.isSatelliteView = !this.isSatelliteView;
    this.osmLayer.setVisible(!this.isSatelliteView);
    this.satelliteLayer.setVisible(this.isSatelliteView);
  }

  openInGoogleMaps(): void {
    if (!this.actif.geometry?.coordinates) return;

    let lat: number, lng: number;
    const coords = this.actif.geometry.coordinates;

    switch (this.actif.geometry.type) {
      case 'Point':
        [lng, lat] = coords as [number, number];
        break;
      case 'LineString':
        [lng, lat] = (coords as number[][])[0];
        break;
      case 'Polygon':
        [lng, lat] = (coords as number[][][])[0][0];
        break;
      default:
        return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  }

  getActifIcon(): string {
    const ouvrage = this.actif.ouvrage?.toLowerCase() || '';
    
    if (ouvrage.includes('quai')) return 'anchor';
    if (ouvrage.includes('terre-plein')) return 'landscape';
    if (ouvrage.includes('routière')) return 'road';
    if (ouvrage.includes('bâtiment')) return 'domain';
    if (ouvrage.includes('manutention')) return 'precision_manufacturing';
    
    return 'engineering';
  }

  getGeometryIcon(): string {
    const type = this.actif.geometry?.type;
    switch (type) {
      case 'Point': return 'place';
      case 'LineString': return 'timeline';
      case 'Polygon': return 'crop_free';
      default: return 'location_on';
    }
  }

  getGeometryLabel(): string {
    const type = this.actif.geometry?.type;
    switch (type) {
      case 'Point': return 'Point';
      case 'LineString': return 'Ligne';
      case 'Polygon': return 'Zone';
      default: return 'Géométrie';
    }
  }

  getCoordinatesText(): string {
    if (!this.actif.geometry?.coordinates) return 'Aucune coordonnée';

    const coords = this.actif.geometry.coordinates;
    
    switch (this.actif.geometry.type) {
      case 'Point':
        const [lng, lat] = coords as [number, number];
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      case 'LineString':
        const lineLength = (coords as number[][]).length;
        return `Ligne avec ${lineLength} points`;
      case 'Polygon':
        const polygonPoints = (coords as number[][][])[0].length - 1;
        return `Zone avec ${polygonPoints} sommets`;
      default:
        return 'Géométrie inconnue';
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}