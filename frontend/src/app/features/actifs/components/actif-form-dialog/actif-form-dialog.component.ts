import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import { ActifsService } from '../../services/actifs.service';
import { CreateActifDto } from '../../../../core/models/actif.interface';

// OpenLayers Imports
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import LayerGroup from 'ol/layer/Group';
import { fromLonLat } from 'ol/proj';
import { Draw } from 'ol/interaction';
import { Style, Fill, Stroke, Circle, Text } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import LayerSwitcher from 'ol-ext/control/LayerSwitcher';
import FullScreen from 'ol/control/FullScreen';

interface GeoJsonGeometry {
  type: string;
  coordinates: any[];
}

interface DropdownOption {
  value: string | number;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-actif-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, 
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, 
    MatButtonToggleModule, MatTooltipModule, MatProgressSpinnerModule, 
    MatSnackBarModule, MatCardModule, MatDividerModule, MatChipsModule
  ],
  templateUrl: './actif-form-dialog.html',
  styleUrls: ['./actif-form-dialog.scss']
})
export class ActifFormDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  actifForm: FormGroup;
  isSaving = false;
  private map!: Map;
  private drawSource = new VectorSource();
  private drawInteraction!: Draw;
  private osmLayer!: TileLayer<OSM>;
  private satelliteLayer!: TileLayer<XYZ>;

  // Dropdown options
  siteOptions: DropdownOption[] = [
    { value: 'Port de Tanger Med TC1', label: 'Terminal à Conteneurs 1 (TC1)', icon: 'local_shipping' },
    { value: 'Port de Tanger Med TC2', label: 'Terminal à Conteneurs 2 (TC2)', icon: 'local_shipping' },
    { value: 'Port de Tanger Med TC3', label: 'Terminal à Conteneurs 3 (TC3)', icon: 'local_shipping' },
    { value: 'Port de Tanger Med Passagers', label: 'Terminal Passagers', icon: 'directions_boat' },
    { value: 'Port de Tanger Med Roulier', label: 'Terminal Roulier', icon: 'local_shipping' },
    { value: 'Port de Tanger Med 2', label: 'Tanger Med Port 2', icon: 'business' },
  ];

  zoneOptions: DropdownOption[] = [
    { value: 'Zone Portuaire Nord', label: 'Zone Portuaire Nord', icon: 'north' },
    { value: 'Zone Portuaire Sud', label: 'Zone Portuaire Sud', icon: 'south' },
    { value: 'Zone Portuaire Est', label: 'Zone Portuaire Est', icon: 'east' },
    { value: 'Zone Portuaire Ouest', label: 'Zone Portuaire Ouest', icon: 'west' },
    { value: 'Zone Administrative', label: 'Zone Administrative', icon: 'business' },
    { value: 'Zone Technique', label: 'Zone Technique', icon: 'build' },
    { value: 'Zone de Stockage', label: 'Zone de Stockage', icon: 'inventory' },
    { value: 'Zone Ferroviaire', label: 'Zone Ferroviaire', icon: 'train' },
  ];

  ouvrageOptions: DropdownOption[] = [
    { value: 'Quai d\'accostage', label: 'Quai d\'accostage', icon: 'anchor' },
    { value: 'Terre-plein', label: 'Terre-plein', icon: 'landscape' },
    { value: 'Jetée', label: 'Jetée', icon: 'water' },
    { value: 'Brise-lames', label: 'Brise-lames', icon: 'waves' },
    { value: 'Écluse', label: 'Écluse', icon: 'lock' },
    { value: 'Bassin', label: 'Bassin', icon: 'pool' },
    { value: 'Chenal', label: 'Chenal', icon: 'waterfall_chart' },
    { value: 'Infrastructure routière', label: 'Infrastructure routière', icon: 'road' },
    { value: 'Bâtiment', label: 'Bâtiment', icon: 'business' },
    { value: 'Équipement de manutention', label: 'Équipement de manutention', icon: 'precision_manufacturing' },
    { value: 'Réseau', label: 'Réseau (électrique, eau, etc.)', icon: 'cable' },
  ];

  groupeOptions: DropdownOption[] = [
    { value: 1, label: 'Infrastructures Portuaires', icon: 'foundation' },
    { value: 2, label: 'Équipements de Manutention', icon: 'precision_manufacturing' },
    { value: 3, label: 'Installations de Stockage', icon: 'inventory_2' },
    { value: 4, label: 'Réseaux et Utilités', icon: 'cable' },
    { value: 5, label: 'Bâtiments et Structures', icon: 'business' },
    { value: 6, label: 'Équipements de Sécurité', icon: 'security' },
    { value: 7, label: 'Systèmes de Navigation', icon: 'navigation' },
    { value: 8, label: 'Équipements Ferroviaires', icon: 'train' },
  ];

  drawingTypes = [
    { value: 'Point' as const, label: 'Point', icon: 'place', tooltip: 'Marquer un point précis' },
    { value: 'LineString' as const, label: 'Ligne', icon: 'timeline', tooltip: 'Dessiner une ligne ou un tracé' },
    { value: 'Polygon' as const, label: 'Zone', icon: 'crop_free', tooltip: 'Délimiter une zone ou surface' }
  ];

  currentDrawingType: 'Point' | 'LineString' | 'Polygon' | null = null;
  hasGeometry = false;
  selectedBaseMap: 'osm' | 'satellite' = 'osm';

  // Default coordinates for Tanger Med
  private readonly TANGER_MED_COORDS: [number, number] = [-5.8340, 35.7595];
  private readonly DEFAULT_ZOOM = 14;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ActifFormDialogComponent>,
    private actifsService: ActifsService,
    private snackBar: MatSnackBar
  ) {
    this.actifForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-_]+$/)]],
      site: ['', Validators.required],
      zone: ['', Validators.required],
      ouvrage: ['', Validators.required],
      idGroupe: [null, [Validators.required]],
      geometryType: [null, Validators.required],
      coordinates: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    // Set default values
    this.actifForm.patchValue({
      site: 'Port de Tanger Med TC1'
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.setTarget(undefined);
    }
  }

  private initMap(): void {
    // Create base layers
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
      properties: { title: 'Cartes de base' }
    });

    // Vector layer for drawing
    const drawLayer = new VectorLayer({
      source: this.drawSource,
      properties: { title: 'Géométrie' },
      style: new Style({
        fill: new Fill({
          color: 'rgba(25, 118, 210, 0.2)'
        }),
        stroke: new Stroke({
          color: '#1976d2',
          width: 3
        }),
        image: new Circle({
          radius: 8,
          fill: new Fill({
            color: '#1976d2'
          }),
          stroke: new Stroke({
            color: '#ffffff',
            width: 2
          })
        })
      })
    });

    this.map = new Map({
      target: 'drawing-map',
      layers: [baseLayers, drawLayer],
      view: new View({
        center: fromLonLat(this.TANGER_MED_COORDS),
        zoom: this.DEFAULT_ZOOM,
        maxZoom: 20,
        minZoom: 10
      }),
    });

    // Add controls
    this.map.addControl(new LayerSwitcher());
    this.map.addControl(new FullScreen());
  }

  addDrawInteraction(type: 'Point' | 'LineString' | 'Polygon'): void {
    // Remove existing interaction
    if (this.drawInteraction) {
      this.map.removeInteraction(this.drawInteraction);
    }

    this.clearDrawing();
    this.currentDrawingType = type;

    this.drawInteraction = new Draw({
      source: this.drawSource,
      type: type,
    });

    this.map.addInteraction(this.drawInteraction);

    this.drawInteraction.on('drawstart', () => {
      this.clearDrawing();
    });

    this.drawInteraction.on('drawend', (event) => {
      const olGeometry = event.feature.getGeometry();
      if (olGeometry) {
        const geometryObject = new GeoJSON().writeGeometryObject(olGeometry, {
          featureProjection: 'EPSG:3857',
          dataProjection: 'EPSG:4326',
        }) as GeoJsonGeometry;

        this.actifForm.patchValue({
          geometryType: geometryObject.type,
          coordinates: geometryObject.coordinates
        });

        this.hasGeometry = true;
        this.actifForm.get('coordinates')?.markAsTouched();
        this.actifForm.get('geometryType')?.markAsTouched();

        this.snackBar.open(`${this.getGeometryTypeLabel(geometryObject.type)} ajouté avec succès`, 'Fermer', {
          duration: 2000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  clearDrawing(): void {
    this.drawSource.clear();
    this.hasGeometry = false;
    this.actifForm.patchValue({
      geometryType: null,
      coordinates: null
    });
    
    if (this.drawInteraction) {
      this.map.removeInteraction(this.drawInteraction);
    }
    this.currentDrawingType = null;
  }

  switchBaseMap(mapType: 'osm' | 'satellite'): void {
    if (mapType === 'satellite') {
      this.osmLayer.setVisible(false);
      this.satelliteLayer.setVisible(true);
    } else {
      this.osmLayer.setVisible(true);
      this.satelliteLayer.setVisible(false);
    }
  }

  centerOnTangerMed(): void {
    this.map.getView().animate({
      center: fromLonLat(this.TANGER_MED_COORDS),
      zoom: this.DEFAULT_ZOOM,
      duration: 1000
    });
  }

  getGeometryTypeLabel(type: string): string {
    switch (type) {
      case 'Point': return 'Point';
      case 'LineString': return 'Ligne';
      case 'Polygon': return 'Zone';
      default: return 'Géométrie';
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.actifForm.invalid) {
      this.actifForm.markAllAsTouched();
      
      // Show specific error messages
      const errors = [];
      if (this.actifForm.get('nom')?.errors) errors.push('Nom requis (min. 3 caractères)');
      if (this.actifForm.get('code')?.errors) errors.push('Code requis (format: A-Z, 0-9, -, _)');
      if (!this.hasGeometry) errors.push('Dessinez une géométrie sur la carte');
      
      this.snackBar.open(`Erreurs: ${errors.join(', ')}`, 'Fermer', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isSaving = true;
    const newActifData: CreateActifDto = {
      ...this.actifForm.value,
      idGroupe: Number(this.actifForm.value.idGroupe)
    };

    this.actifsService.createActif(newActifData).subscribe({
      next: (createdActif) => {
        this.isSaving = false;
        this.snackBar.open(`Actif "${createdActif.nom}" créé avec succès!`, 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.dialogRef.close(createdActif);
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Erreur création:', err);
        this.snackBar.open(`Erreur lors de la création: ${err.message}`, 'Fermer', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      },
    });
  }

  // Form validation helpers
  getFieldError(fieldName: string): string {
    const field = this.actifForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} est requis`;
      if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['pattern']) return 'Format invalide';
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.actifForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }
}