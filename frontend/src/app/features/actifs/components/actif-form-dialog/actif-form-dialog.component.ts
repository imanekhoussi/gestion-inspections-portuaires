import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Actif } from '../../../../core/models/actif.interface';
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
import { fromLonLat } from 'ol/proj';
import { Draw, Modify } from 'ol/interaction';
import { Style, Fill, Stroke, Circle } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import { Geometry } from 'ol/geom';
import * as olSphere from 'ol/sphere';

// Interface definitions
interface GeoJsonGeometry {
  type: string;
  coordinates: any[];
}

interface DropdownOption {
  value: string | number;
  label: string;
  icon?: string;
}

interface GeometryInfo {
  length?: string;
  area?: string;
  perimeter?: string;
  coordinates?: string;
}

@Component({
  selector: 'app-actif-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './actif-form-dialog.html',
  styleUrls: ['./actif-form-dialog.scss']
})
export class ActifFormDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  actifForm: FormGroup;
  isSaving = false;
  hasGeometry = false;
  isSatelliteView = false;
  isMapLoading = false;

  isEditMode = false;
  dialogTitle = 'Créer un nouvel actif';

  // Simplified editing states
  isAdvancedEditActive = false;
  showGeometryInfoPanel = false;
  geometryInfo: GeometryInfo = {};

  // Map and interactions
  private map!: Map;
  private drawSource = new VectorSource();
  private drawInteraction?: Draw;
  private modifyInteraction?: Modify;
  private osmLayer!: TileLayer<OSM>;
  private satelliteLayer!: TileLayer<XYZ>;

  private readonly TANGER_MED_COORDS: [number, number] = [-5.526, 35.88];
  private readonly DEFAULT_ZOOM = 14;

  // Enhanced dropdown options
  siteOptions: DropdownOption[] = [
    { value: 'Port de Tanger Med TC1', label: 'Terminal à Conteneurs 1 (TC1)', icon: 'local_shipping' },
    { value: 'Port de Tanger Med TC2', label: 'Terminal à Conteneurs 2 (TC2)', icon: 'local_shipping' },
    { value: 'Port de Tanger Med TC3', label: 'Terminal à Conteneurs 3 (TC3)', icon: 'local_shipping' },
    { value: 'Port de Tanger Med Passagers', label: 'Terminal Passagers', icon: 'directions_boat' },
  ];

  zoneOptions: DropdownOption[] = [
    { value: 'Zone Portuaire Nord', label: 'Zone Portuaire Nord', icon: 'north' },
    { value: 'Zone Portuaire Sud', label: 'Zone Portuaire Sud', icon: 'south' },
    { value: 'Zone Administrative', label: 'Zone Administrative', icon: 'business' },
    { value: 'Zone Technique', label: 'Zone Technique', icon: 'engineering' },
  ];

  ouvrageOptions: DropdownOption[] = [
    { value: 'Quai d\'accostage', label: 'Quai d\'accostage', icon: 'dock' },
    { value: 'Terre-plein', label: 'Terre-plein', icon: 'landscape' },
    { value: 'Infrastructure routière', label: 'Infrastructure routière', icon: 'road' },
    { value: 'Bâtiment', label: 'Bâtiment', icon: 'domain' },
    { value: 'Équipement de manutention', label: 'Équipement de manutention', icon: 'precision_manufacturing' },
  ];

  groupeOptions: DropdownOption[] = [];
  isLoadingGroupes = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ActifFormDialogComponent>,
    private actifsService: ActifsService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data?: { actif?: Actif, mode?: 'create' | 'edit' }
  ) {
    this.actifForm = this.createForm();
  }

  private createForm(): FormGroup {
  return this.fb.group({
    nom: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    code: [{ value: '', disabled: false }, [Validators.required, Validators.pattern(/^[A-Z0-9-_]+$/), Validators.maxLength(50)]],
    site: ['', Validators.required],
    zone: ['', Validators.required],
    ouvrage: ['', Validators.required],
    idGroupe: [{ value: null, disabled: false }, [Validators.required]], // 🔧 Correction ici
    geometryType: [null, Validators.required],
    coordinates: [null, Validators.required],
  });
}

private updateFormControlsState(): void {
  if (this.isEditMode) {
    // Désactiver le code en mode édition
    this.actifForm.get('code')?.disable();
  } else {
    // Activer le code en mode création
    this.actifForm.get('code')?.enable();
  }
  
  // Gérer l'état du select des groupes
  if (this.isLoadingGroupes) {
    this.actifForm.get('idGroupe')?.disable();
  } else {
    this.actifForm.get('idGroupe')?.enable();
  }
}

 ngOnInit(): void {
  this.setupFormValidation();
  
  console.log('🔍 Données reçues dans le dialog:', this.data);
  
  this.isEditMode = this.data?.mode === 'edit' || !!this.data?.actif;
  this.dialogTitle = this.isEditMode ? 'Modifier l\'actif' : 'Créer un nouvel actif';
  
  // 🔧 Mettre à jour l'état des contrôles
  this.updateFormControlsState();
  
  console.log('🔍 Mode détecté:', this.isEditMode ? 'EDITION' : 'CREATION');
  
  this.loadGroupesFromDatabase(() => {
    // 🔧 Réactiver le select des groupes une fois chargés
    this.actifForm.get('idGroupe')?.enable();
    
    if (this.isEditMode && this.data?.actif) {
      console.log('⚡ Chargement des données pour édition:', this.data.actif);
      this.loadActifForEdit(this.data.actif);
    }
  });
}

  ngAfterViewInit(): void {
    setTimeout(() => this.initializeMap(), 150);
  }

  ngOnDestroy(): void {
    this.cleanupInteractions();
    if (this.map) {
      this.map.setTarget(undefined);
    }
  }

  // MAP INITIALIZATION
  private initializeMap(): void {
    this.isMapLoading = true;
    this.createBaseLayers();
    this.createDrawLayer();
    this.setupMap();
    this.setupEditingTools();
    this.isMapLoading = false;
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

  private createDrawLayer(): VectorLayer<VectorSource> {
    return new VectorLayer({
      source: this.drawSource,
      style: new Style({
        fill: new Fill({ color: 'rgba(59, 130, 246, 0.1)' }),
        stroke: new Stroke({ color: '#3b82f6', width: 3 }),
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: '#3b82f6' }),
          stroke: new Stroke({ color: '#ffffff', width: 2 })
        })
      })
    });
  }

  private setupMap(): void {
    const drawLayer = this.createDrawLayer();

    this.map = new Map({
      target: 'drawing-map',
      layers: [this.osmLayer, this.satelliteLayer, drawLayer],
      view: new View({
        center: fromLonLat(this.TANGER_MED_COORDS),
        zoom: this.DEFAULT_ZOOM,
        maxZoom: 20,
        minZoom: 10
      }),
      controls: []
    });

    this.map.on('loadstart', () => this.isMapLoading = true);
    this.map.on('loadend', () => this.isMapLoading = false);
  }

  // SIMPLIFIED EDITING TOOLS
  private setupEditingTools(): void {
    this.modifyInteraction = new Modify({
      source: this.drawSource,
      style: new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: '#ff6b35' }),
          stroke: new Stroke({ color: '#ffffff', width: 2 })
        })
      })
    });

    this.map.addInteraction(this.modifyInteraction);
    this.modifyInteraction.setActive(false);
  }

  // FORM VALIDATION
  private setupFormValidation(): void {
    this.actifForm.get('code')?.valueChanges.subscribe(value => {
      if (value) {
        this.actifForm.get('code')?.setValue(value.toUpperCase(), { emitEvent: false });
      }
    });

    this.actifForm.valueChanges.subscribe(() => {
      this.suggestCodeIfEmpty();
    });
  }

  private suggestCodeIfEmpty(): void {
    const codeControl = this.actifForm.get('code');
    if (!codeControl?.value && this.actifForm.get('site')?.value && this.actifForm.get('ouvrage')?.value) {
      const site = this.actifForm.get('site')?.value;
      const ouvrage = this.actifForm.get('ouvrage')?.value;
      
      const siteCode = site.includes('TC1') ? 'TC1' : site.includes('TC2') ? 'TC2' : site.includes('TC3') ? 'TC3' : 'TMD';
      const ouvrageCode = this.getOuvrageCode(ouvrage);
      const timestamp = Date.now().toString().slice(-4);
      
      const suggestedCode = `${ouvrageCode}-${siteCode}-${timestamp}`;
      codeControl?.setValue(suggestedCode);
    }
  }

  private getOuvrageCode(ouvrage: string): string {
    const codes: { [key: string]: string } = {
      'Quai d\'accostage': 'QAI',
      'Terre-plein': 'TPL',
      'Infrastructure routière': 'IRO',
      'Bâtiment': 'BAT',
      'Équipement de manutention': 'EQM'
    };
    return codes[ouvrage] || 'GEN';
  }

  // DRAWING METHODS
  startDrawing(type: 'Point' | 'LineString' | 'Polygon'): void {
    if (this.hasGeometry && !this.confirmGeometryReplacement()) {
      return;
    }

    this.clearDrawing(true);
    this.disableAdvancedEdit();
    this.removeExistingDrawInteraction();
    this.createDrawInteraction(type);
    this.showDrawingFeedback(type);
  }

  private confirmGeometryReplacement(): boolean {
    return confirm('Une géométrie existe déjà. Voulez-vous la remplacer ?');
  }

  private removeExistingDrawInteraction(): void {
    if (this.drawInteraction) {
      this.map.removeInteraction(this.drawInteraction);
    }
  }

  private createDrawInteraction(type: 'Point' | 'LineString' | 'Polygon'): void {
    this.drawInteraction = new Draw({
      source: this.drawSource,
      type: type
    });
    
    this.map.addInteraction(this.drawInteraction);
    
    this.drawInteraction.on('drawend', (event) => {
      this.handleDrawEnd(event);
    });
  }

  private showDrawingFeedback(type: string): void {
    const typeLabel = this.getGeometryTypeLabel(type);
    this.snackBar.open(
      `Mode dessin activé: ${typeLabel}. Cliquez sur la carte pour commencer.`,
      'OK',
      { duration: 4000 }
    );
  }

  private handleDrawEnd(event: any): void {
    const olGeometry = event.feature.getGeometry();
    if (!olGeometry) return;

    const geometryObject = new GeoJSON().writeGeometryObject(olGeometry, {
      featureProjection: 'EPSG:3857',
      dataProjection: 'EPSG:4326'
    }) as any;

    if (geometryObject && geometryObject.type && geometryObject.coordinates) {
      this.updateFormGeometry(geometryObject as GeoJsonGeometry);
      this.finalizeDrawing(geometryObject.type);
      this.calculateGeometryInfo(olGeometry);
    }
  }

  private updateFormGeometry(geometryObject: GeoJsonGeometry): void {
    this.actifForm.patchValue({
      geometryType: geometryObject.type,
      coordinates: geometryObject.coordinates
    });
    
    this.hasGeometry = true;
    this.actifForm.get('coordinates')?.updateValueAndValidity();
  }

  private finalizeDrawing(geometryType: string): void {
    this.removeExistingDrawInteraction();
    
    const typeLabel = this.getGeometryTypeLabel(geometryType);
    this.snackBar.open(
      `✔ ${typeLabel} enregistré avec succès.`,
      '',
      { 
        duration: 3000,
        panelClass: ['success-snackbar']
      }
    );
  }

  // EDITING METHODS
  enableAdvancedEdit(): void {
    if (!this.hasGeometry) {
      this.snackBar.open('Aucune géométrie à modifier', 'Fermer', { duration: 3000 });
      return;
    }

    this.isAdvancedEditActive = true;
    this.modifyInteraction?.setActive(true);
    this.snackBar.open(
      '🔧 Mode édition activé. Cliquez sur la géométrie pour modifier les sommets.',
      'OK',
      { duration: 4000 }
    );
  }

  disableAdvancedEdit(): void {
    this.isAdvancedEditActive = false;
    this.modifyInteraction?.setActive(false);
  }

  enableTransform(): void {
    this.snackBar.open('Édition avancée activée - utilisez les poignées pour modifier', '', { duration: 3000 });
    this.enableAdvancedEdit();
  }

  enableDrawHole(): void {
    if (this.actifForm.get('geometryType')?.value !== 'Polygon') {
      this.snackBar.open('Cette fonction n\'est disponible que pour les polygones', 'Fermer', { duration: 3000 });
      return;
    }
    this.snackBar.open('Fonction de trou disponible - redessinez votre polygone avec les zones à exclure', '', { duration: 4000 });
  }

  validateGeometryEdits(): void {
    const features = this.drawSource.getFeatures();
    if (features.length > 0) {
      const feature = features[0];
      const geometry = feature.getGeometry();
      
      if (geometry) {
        const geometryObject = new GeoJSON().writeGeometryObject(geometry, {
          featureProjection: 'EPSG:3857',
          dataProjection: 'EPSG:4326'
        }) as any;
        
        if (geometryObject && geometryObject.type && geometryObject.coordinates) {
          this.updateFormGeometry(geometryObject as GeoJsonGeometry);
          this.calculateGeometryInfo(geometry);
          this.disableAdvancedEdit();
          
          this.snackBar.open(
            '✅ Modifications géométriques sauvegardées',
            '',
            { duration: 3000, panelClass: ['success-snackbar'] }
          );
        }
      }
    }
  }

  cancelAdvancedEdit(): void {
    if (confirm('Voulez-vous vraiment annuler l\'édition ? Les modifications non validées seront perdues.')) {
      this.disableAdvancedEdit();
      if (this.isEditMode && this.data?.actif?.geometry) {
        this.displayExistingGeometry(this.data.actif.geometry);
      }
    }
  }

  undoEdit(): void {
    this.snackBar.open('Fonction Undo - rechargement de la géométrie originale', '', { duration: 1500 });
    if (this.isEditMode && this.data?.actif?.geometry) {
      this.drawSource.clear();
      this.displayExistingGeometry(this.data.actif.geometry);
    }
  }

  redoEdit(): void {
    this.snackBar.open('Fonction Redo disponible en mode édition avancée', '', { duration: 1500 });
  }

  // GEOMETRY INFORMATION
 showGeometryInfo(): void {
  if (!this.hasGeometry) {
    this.snackBar.open('Aucune géométrie à analyser', 'Fermer', { duration: 3000 });
    return;
  }

  const features = this.drawSource.getFeatures();
  if (features.length > 0) {
    const geometry = features[0].getGeometry();
    if (geometry) {
      this.calculateGeometryInfo(geometry);
      this.showGeometryInfoPanel = true;
    }
  }
}
  hideGeometryInfo(): void {
    this.showGeometryInfoPanel = false;
  }

  private calculateGeometryInfo(geometry: any): void {
  this.geometryInfo = {};
  const geomType = geometry.getType();
  
  if (geomType === 'Point') {
    const coords = geometry.getCoordinates();
    const lonLat = fromLonLat(coords);
    this.geometryInfo.coordinates = `${lonLat[1].toFixed(6)}, ${lonLat[0].toFixed(6)}`;
  } 
  else if (geomType === 'LineString') {
    const length = olSphere.getLength(geometry);
    this.geometryInfo.length = `${(length / 1000).toFixed(2)} km`;
    
    const coords = geometry.getCoordinates();
    this.geometryInfo.coordinates = `${coords.length} points`;
  } 
  else if (geomType === 'Polygon') {
    const area = olSphere.getArea(geometry);
    this.geometryInfo.area = `${(area / 10000).toFixed(2)} ha`;
    
    const perimeter = olSphere.getLength(geometry);
    this.geometryInfo.perimeter = `${(perimeter / 1000).toFixed(2)} km`;
    
    const coords = geometry.getCoordinates()[0];
    this.geometryInfo.coordinates = `${coords.length - 1} sommets`;
  }
}

  // GEOMETRY OPERATIONS
  changeGeometryType(newType: 'Point' | 'LineString' | 'Polygon'): void {
    const currentType = this.actifForm.get('geometryType')?.value;
    if (currentType === newType) {
      this.snackBar.open('La géométrie est déjà de ce type', '', { duration: 2000 });
      return;
    }

    const typeLabel = this.getGeometryTypeLabel(newType);
    
    if (confirm(`Voulez-vous vraiment convertir cette géométrie en ${typeLabel} ? L'ancienne géométrie sera supprimée.`)) {
      this.clearDrawing(true);
      this.disableAdvancedEdit();
      this.startDrawing(newType);
    }
  }

  editGeometry(): void {
    const currentType = this.actifForm.get('geometryType')?.value;
    if (!currentType) {
      this.snackBar.open('Aucun type de géométrie défini', 'Fermer', { duration: 3000 });
      return;
    }

    const typeLabel = this.getGeometryTypeLabel(currentType);
    if (confirm(`Voulez-vous redessiner complètement cette ${typeLabel.toLowerCase()} ?`)) {
      this.startDrawing(currentType);
    }
  }

  deleteGeometry(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer la géométrie ?')) {
      this.clearDrawing(false);
      this.disableAdvancedEdit();
    }
  }

  private clearDrawing(isQuiet: boolean): void {
    this.drawSource.clear();
    this.actifForm.patchValue({ geometryType: null, coordinates: null });
    this.hasGeometry = false;
    this.actifForm.get('coordinates')?.updateValueAndValidity();
    
    if (!isQuiet) {
      this.snackBar.open('Géométrie supprimée.', '', { duration: 2000 });
    }
  }

  // MAP CONTROLS
  switchBaseMap(): void {
    this.isSatelliteView = !this.isSatelliteView;
    this.osmLayer.setVisible(!this.isSatelliteView);
    this.satelliteLayer.setVisible(this.isSatelliteView);
    
    this.snackBar.open(
      `Vue ${this.isSatelliteView ? 'satellite' : 'plan'} activée`,
      '',
      { duration: 1500 }
    );
  }

  centerOnTangerMed(): void {
    this.map.getView().animate({
      center: fromLonLat(this.TANGER_MED_COORDS),
      zoom: this.DEFAULT_ZOOM,
      duration: 1000
    });
  }

  centerOnGeometry(): void {
    const features = this.drawSource.getFeatures();
    if (features.length > 0) {
      const extent = features[0].getGeometry()?.getExtent();
      if (extent) {
        this.map.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          maxZoom: 18,
          duration: 1000
        });
      }
    }
  }

  toggleFullscreen(): void {
    const mapContainer = document.getElementById('drawing-map');
    if (mapContainer) {
      if (!document.fullscreenElement) {
        mapContainer.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    }
  }

  // DATA LOADING
  private loadGroupesFromDatabase(callback?: () => void): void {
    this.isLoadingGroupes = true;
    
    this.actifsService.getGroupes().subscribe({
      next: (groupes) => {
        this.groupeOptions = groupes.map(groupe => ({
          value: groupe.id,
          label: groupe.nom,
          icon: this.getGroupeIcon(groupe.nom)
        }));
        
        this.isLoadingGroupes = false;
        this.snackBar.open(`✅ ${groupes.length} groupes chargés`, '', { duration: 2000 });
        if (callback) callback();
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des groupes:', error);
        this.isLoadingGroupes = false;
        
        this.groupeOptions = [
          { value: 1, label: 'Quais et Appontements', icon: 'anchor' },
          { value: 2, label: 'Digues et Jetées', icon: 'waves' },
          { value: 3, label: 'Grues Portuaires', icon: 'construction' },
          { value: 4, label: 'Portiques', icon: 'view_column' },
          { value: 5, label: 'Éclairage de Sécurité', icon: 'light_mode' },
          { value: 6, label: 'Transformateurs', icon: 'electrical_services' },
          { value: 7, label: 'Tableaux Électriques', icon: 'developer_board' }
        ];
        
        this.snackBar.open('⚠️ Utilisation des groupes par défaut.', 'Fermer', { duration: 5000 });
        if (callback) callback();
      }
    });
  }

  private getGroupeIcon(nom: string): string {
    const nomLower = nom.toLowerCase();
    
    if (nomLower.includes('quai') || nomLower.includes('appontement')) return 'anchor';
    if (nomLower.includes('digue') || nomLower.includes('jetée')) return 'waves';
    if (nomLower.includes('grue')) return 'construction';
    if (nomLower.includes('portique')) return 'view_column';
    if (nomLower.includes('éclairage')) return 'light_mode';
    if (nomLower.includes('transformateur')) return 'electrical_services';
    if (nomLower.includes('tableau')) return 'developer_board';
    
    return 'category';
  }

  private loadActifForEdit(actif: Actif): void {
    this.actifForm.patchValue({
      nom: actif.nom || '',
      code: actif.code || '',
      site: actif.site || '',
      zone: actif.zone || '',
      ouvrage: actif.ouvrage || '',
      idGroupe: actif.idGroupe || actif.groupe?.id || null
    });

    if (actif.geometry && actif.geometry.coordinates) {
      this.actifForm.patchValue({
        geometryType: actif.geometry.type,
        coordinates: actif.geometry.coordinates
      });
      
      this.hasGeometry = true;
      this.waitForMapAndDisplayGeometry(actif.geometry);
    }
    
    this.snackBar.open(`📁 Données de "${actif.nom}" chargées pour modification`, '', { 
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  private waitForMapAndDisplayGeometry(geometry: any): void {
    const checkMapAndDisplay = () => {
      if (this.map) {
        this.displayExistingGeometry(geometry);
      } else {
        setTimeout(checkMapAndDisplay, 200);
      }
    };
    setTimeout(checkMapAndDisplay, 300);
  }

  private displayExistingGeometry(geometry: any): void {
    if (!this.map || !geometry) return;

    try {
      const geoJsonFormat = new GeoJSON();
      const featureOrFeatures = geoJsonFormat.readFeature({
        type: 'Feature',
        geometry: geometry
      }, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      });

      const feature = Array.isArray(featureOrFeatures) ? featureOrFeatures[0] : featureOrFeatures;

      if (!feature) {
        console.error('❌ Impossible de créer la feature depuis la géométrie');
        return;
      }

      this.drawSource.addFeature(feature);

      const featureGeometry = feature.getGeometry();
      if (featureGeometry) {
        const extent = featureGeometry.getExtent();
        if (extent && extent.length === 4) {
          this.map.getView().fit(extent, {
            padding: [50, 50, 50, 50],
            maxZoom: 18,
            duration: 1000
          });
        }
        this.calculateGeometryInfo(featureGeometry);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'affichage de la géométrie:', error);
    }
  }

  // SAVE METHODS
  onSave(): void {
    if (this.actifForm.invalid) {
      this.handleFormErrors();
      return;
    }
    this.performSave();
  }

  private handleFormErrors(): void {
    this.actifForm.markAllAsTouched();
    
    const firstErrorField = this.findFirstErrorField();
    if (firstErrorField) {
      this.scrollToField(firstErrorField);
    }
    
    this.snackBar.open(
      'Veuillez corriger les erreurs dans le formulaire.',
      'Fermer',
      { 
        duration: 4000,
        panelClass: ['error-snackbar']
      }
    );
  }

  private findFirstErrorField(): string | null {
    const fieldOrder = ['nom', 'code', 'site', 'zone', 'ouvrage', 'idGroupe', 'coordinates'];
    
    for (const field of fieldOrder) {
      if (this.actifForm.get(field)?.invalid) {
        return field;
      }
    }
    return null;
  }

  private scrollToField(fieldName: string): void {
    const element = document.querySelector(`[formControlName="${fieldName}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  private performSave(): void {
    this.isSaving = true;
    
    const formValue = this.actifForm.getRawValue();
    const actifData: CreateActifDto = {
      ...formValue,
      idGroupe: Number(formValue.idGroupe)
    };

    console.log('🚀 Données envoyées:', actifData);
    console.log('🎯 Mode:', this.isEditMode ? 'EDITION' : 'CREATION');

    if (this.isEditMode && this.data?.actif?.id) {
      console.log('✏️ Mise à jour de l\'actif ID:', this.data.actif.id);
      this.actifsService.updateActif(this.data.actif.id, actifData).subscribe({
        next: (updatedActif) => this.handleSaveSuccess(updatedActif, 'modifié'),
        error: (error) => this.handleSaveError(error)
      });
    } else {
      console.log('➕ Création d\'un nouvel actif');
      this.actifsService.createActif(actifData).subscribe({
        next: (createdActif) => this.handleSaveSuccess(createdActif, 'créé'),
        error: (error) => this.handleSaveError(error)
      });
    }
  }

  private handleSaveSuccess(actif: any, action: string): void {
    this.isSaving = false;
    
    this.snackBar.open(
      `✔ Actif "${actif.nom}" ${action} avec succès!`,
      'Fermer',
      { 
        duration: 4000,
        panelClass: ['success-snackbar']
      }
    );
    
    this.dialogRef.close(actif);
  }

  private handleSaveError(error: any): void {
    this.isSaving = false;
    
    const errorMessage = error?.error?.message || error?.message || 'Une erreur inattendue s\'est produite';
    
    this.snackBar.open(
      `Erreur: ${errorMessage}`,
      'Réessayer',
      { 
        duration: 6000,
        panelClass: ['error-snackbar']
      }
    );
  }

  // ADDITIONAL METHODS
  previewChanges(): void {
    if (this.actifForm.invalid) {
      this.snackBar.open('Formulaire invalide', 'Fermer', { duration: 3000 });
      return;
    }
    this.snackBar.open('Fonctionnalité d\'aperçu à implémenter', 'OK', { duration: 2000 });
  }

  onCancel(): void {
    if (this.hasUnsavedChanges()) {
      if (confirm('Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir fermer ?')) {
        this.dialogRef.close();
      }
    } else {
      this.dialogRef.close();
    }
  }

  private hasUnsavedChanges(): boolean {
    return this.actifForm.dirty || this.hasGeometry;
  }

  private cleanupInteractions(): void {
    if (this.modifyInteraction) {
      this.map.removeInteraction(this.modifyInteraction);
    }
  }

  // UTILITY METHODS
  isFieldInvalid = (field: string): boolean => {
    const control = this.actifForm.get(field);
    return !!(control?.invalid && control?.touched);
  };
  
  getFieldError(field: string): string {
    const control = this.actifForm.get(field);
    if (!control || !control.errors) return '';
    
    const errors = control.errors;
    if (errors['required']) return 'Ce champ est obligatoire';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} caractères`;
    if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} caractères`;
    if (errors['pattern']) return 'Format invalide (utilisez uniquement A-Z, 0-9, - et _)';
    
    return 'Valeur invalide';
  }

  getGeometryTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      'Point': 'Point',
      'LineString': 'Ligne',
      'Polygon': 'Zone'
    };
    return labels[type] || 'Géométrie';
  };

  getLatitude(): string {
  if (this.actifForm.get('geometryType')?.value === 'Point' && this.actifForm.get('coordinates')?.value) {
    const coords = this.actifForm.get('coordinates')?.value;
    if (coords && coords.length >= 2) {
      return coords[1].toFixed(6); // Latitude = index 1
    }
  }
  return 'N/A';
}

getLongitude(): string {
  if (this.actifForm.get('geometryType')?.value === 'Point' && this.actifForm.get('coordinates')?.value) {
    const coords = this.actifForm.get('coordinates')?.value;
    if (coords && coords.length >= 2) {
      return coords[0].toFixed(6); // Longitude = index 0
    }
  }
  return 'N/A';
}

// 🔥 NOUVELLE: Méthode pour les tooltips adaptatifs
getInfoTooltip(): string {
  const geometryType = this.actifForm.get('geometryType')?.value;
  switch (geometryType) {
    case 'Point': return 'Coordonnées';
    case 'LineString': return 'Longueur';
    case 'Polygon': return 'Surface et périmètre';
    default: return 'Informations';
  }
}

// 🔥 NOUVELLE: Méthode pour les labels de menu adaptatifs
getInfoMenuLabel(): string {
  const geometryType = this.actifForm.get('geometryType')?.value;
  switch (geometryType) {
    case 'Point': return 'Voir les coordonnées';
    case 'LineString': return 'Voir la longueur';
    case 'Polygon': return 'Voir surface/périmètre';
    default: return 'Voir les informations';
  }
}

// 🔥 NOUVELLE: Méthode pour les icônes adaptatifs
getInfoIcon(): string {
  const geometryType = this.actifForm.get('geometryType')?.value;
  switch (geometryType) {
    case 'Point': return 'place';
    case 'LineString': return 'timeline';
    case 'Polygon': return 'crop_free';
    default: return 'straighten';
  }
}

// 🔥 NOUVELLE: Méthode pour les titres adaptatifs
getInfoTitle(): string {
  const geometryType = this.actifForm.get('geometryType')?.value;
  switch (geometryType) {
    case 'Point': return 'Coordonnées du point';
    case 'LineString': return 'Informations de la ligne';
    case 'Polygon': return 'Informations de la zone';
    default: return 'Informations géométriques';
  }
}
}