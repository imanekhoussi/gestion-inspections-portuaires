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

  // ✅ FIXED: Proper form creation with initial disabled states
  private createForm(): FormGroup {
    return this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      // Set initial disabled state in FormControl configuration
      code: [{ value: '', disabled: false }, [Validators.required, Validators.pattern(/^[A-Z0-9-_]+$/), Validators.maxLength(50)]],
      site: ['', Validators.required],
      zone: ['', Validators.required],
      ouvrage: ['', Validators.required],
      // Set initial disabled state in FormControl configuration
      idGroupe: [{ value: null, disabled: false }, [Validators.required]],
      geometryType: [null, Validators.required],
      coordinates: [null, Validators.required],
    });
  }

  // ✅ FIXED: Proper state management using FormControl methods
  private updateFormControlsState(): void {
    const codeControl = this.actifForm.get('code');
    const groupeControl = this.actifForm.get('idGroupe');
    
    // Handle edit mode for code field
    if (this.isEditMode) {
      codeControl?.disable();
    } else {
      codeControl?.enable();
    }
    
    // Handle loading state for groupe select
    if (this.isLoadingGroupes) {
      groupeControl?.disable();
    } else {
      groupeControl?.enable();
    }
  }

  ngOnInit(): void {
    console.log('🚀 === DEBUT ngOnInit ===');
    
    this.setupFormValidation();
    
    console.log('🔍 Données reçues dans le dialog:', this.data);
    console.log('🔍 Type de données:', typeof this.data);
    console.log('🔍 Data.actif:', this.data?.actif);
    console.log('🔍 Data.mode:', this.data?.mode);
    
    this.isEditMode = this.data?.mode === 'edit' || !!this.data?.actif;
    this.dialogTitle = this.isEditMode ? 'Modifier l\'actif' : 'Créer un nouvel actif';
    
    console.log('🔍 Mode détecté:', this.isEditMode ? 'EDITION' : 'CREATION');
    console.log('📝 Titre dialog:', this.dialogTitle);
    
    // ✅ Set initial form state
    this.updateFormControlsState();
    console.log('🔧 États initiaux des contrôles définis');
    
    this.loadGroupesFromDatabase(() => {
      console.log('✅ Groupes chargés, callback exécuté');
      
      // ✅ Update form states after data is loaded
      this.updateFormControlsState();
      console.log('🔧 États des contrôles mis à jour après chargement groupes');
      
      if (this.isEditMode && this.data?.actif) {
        console.log('⚡ Chargement des données pour édition:', this.data.actif);
        
        // ✅ CORRECTION TYPESCRIPT: Double vérification
        setTimeout(() => {
          if (this.data?.actif) {
            this.loadActifForEdit(this.data.actif);
          }
        }, 100);
      } else {
        console.log('📝 Mode création - pas de données à charger');
      }
    });
    
    console.log('✅ === FIN ngOnInit ===');
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initializeMap(), 150);
  }

ngOnDestroy(): void {
  this.cleanupInteractions();
  if (this.map) {
    this.map.setTarget(undefined);
  }
  
  // Nettoyer le timeout
  if (this.geometrySaveTimeout) {
    clearTimeout(this.geometrySaveTimeout);
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


private geometrySaveTimeout: any;

private scheduleGeometrySave(geometryObject: any): void {
  // Annuler la sauvegarde précédente si elle existe
  if (this.geometrySaveTimeout) {
    clearTimeout(this.geometrySaveTimeout);
  }
  
  // Programmer une sauvegarde dans 2 secondes
  this.geometrySaveTimeout = setTimeout(() => {
    this.saveGeometryToServer(geometryObject);
  }, 2000);
}}


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
  
  // Écouter les modifications en temps réel
  this.modifyInteraction.on('modifyend', (event) => {
    const feature = event.features.getArray()[0];
    if (feature && this.isEditMode && this.data?.actif?.id) {
      console.log('Modification géométrie détectée');
      
      const geometry = feature.getGeometry();
      if (geometry) {
        const geometryObject = new GeoJSON().writeGeometryObject(geometry, {
          featureProjection: 'EPSG:3857',
          dataProjection: 'EPSG:4326'
        }) as any;
        
        // Mettre à jour le formulaire immédiatement
        this.updateFormGeometry(geometryObject as GeoJsonGeometry);
        this.calculateGeometryInfo(geometry);
        
        // Sauvegarde automatique différée
        this.scheduleGeometrySave(geometryObject);
      }
    }
  });
}


// 5. Nettoyer le timeout lors de la destruction


// 6. Méthode pour forcer la sauvegarde immédiate (bouton manuel)
forceSaveGeometry(): void {
  const features = this.drawSource.getFeatures();
  if (features.length > 0 && this.isEditMode && this.data?.actif?.id) {
    const feature = features[0];
    const geometry = feature.getGeometry();
    
    if (geometry) {
      const geometryObject = new GeoJSON().writeGeometryObject(geometry, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326'
      }) as any;
      
      this.saveGeometryToServer(geometryObject);
    }
  } else {
    this.snackBar.open('Aucune géométrie à sauvegarder', '', { duration: 2000 });
  }
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
      `✓ ${typeLabel} enregistré avec succès.`,
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
        // Mettre à jour le formulaire
        this.updateFormGeometry(geometryObject as GeoJsonGeometry);
        this.calculateGeometryInfo(geometry);
        
        // Sauvegarder sur le serveur si en mode édition
        if (this.isEditMode && this.data?.actif?.id) {
          this.saveGeometryToServer(geometryObject);
        }
        
        this.disableAdvancedEdit();
        
        this.snackBar.open(
          'Modifications géométriques sauvegardées',
          '',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
      }
    }
  }
}

private saveGeometryToServer(geometryObject: any): void {
  if (!this.data?.actif?.id) {
    console.error('Pas d\'ID actif pour sauvegarder la géométrie');
    return;
  }

  console.log('Sauvegarde géométrie sur serveur:', geometryObject);
  
  // Alternative utilisant updateActif au lieu de updateActifGeometry
  const formValue = this.actifForm.getRawValue();
  const updateData = {
    ...formValue,
    geometryType: geometryObject.type,
    coordinates: geometryObject.coordinates,
    idGroupe: Number(formValue.idGroupe)
  };
  
  console.log('Données complètes à envoyer:', updateData);
  
  // Utiliser la méthode updateActif existante
  this.actifsService.updateActif(this.data.actif.id, updateData).subscribe({
    next: (response: any) => {
      console.log('Actif (avec géométrie) mis à jour:', response);
      this.snackBar.open(
        'Position sauvegardée',
        '',
        { duration: 2000, panelClass: ['success-snackbar'] }
      );
    },
    error: (error: any) => {
      console.error('Erreur sauvegarde:', error);
      this.snackBar.open(
        'Erreur lors de la sauvegarde de la position',
        'Réessayer',
        { duration: 4000, panelClass: ['error-snackbar'] }
      );
    }
  });
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

  // ✅ FIXED: Data loading with proper state management
  private loadGroupesFromDatabase(callback?: () => void): void {
    this.isLoadingGroupes = true;
    this.updateFormControlsState(); // Disable while loading
    
    this.actifsService.getGroupes().subscribe({
      next: (groupes) => {
        this.groupeOptions = groupes.map(groupe => ({
          value: groupe.id,
          label: groupe.nom,
          icon: this.getGroupeIcon(groupe.nom)
        }));
        
        this.isLoadingGroupes = false;
        this.updateFormControlsState(); // Re-enable after loading
        this.snackBar.open(`✅ ${groupes.length} groupes chargés`, '', { duration: 2000 });
        if (callback) callback();
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des groupes:', error);
        this.isLoadingGroupes = false;
        this.updateFormControlsState(); // Re-enable after error
        
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
    console.log('🔍 === DEBUT loadActifForEdit ===');
    console.log('📦 Actif à charger:', JSON.stringify(actif, null, 2));
    
    try {
      // Vérifier la structure de l'actif
      console.log('🔍 Propriétés actif disponibles:', Object.keys(actif));
      console.log('🔍 actif.idGroupe:', actif.idGroupe);
      console.log('🔍 actif.groupe:', actif.groupe);
      console.log('🔍 actif.geometry:', actif.geometry);
      
      // Charger les données du formulaire
      const formData = {
        nom: actif.nom || '',
        code: actif.code || '',
        site: actif.site || '',
        zone: actif.zone || '',
        ouvrage: actif.ouvrage || '',
        idGroupe: actif.idGroupe || actif.groupe?.id || null
      };
      
      console.log('📋 Données à charger dans le form:', formData);
      
      this.actifForm.patchValue(formData);
      
      console.log('✅ Données formulaire chargées');
      console.log('📋 Valeurs form après patch:', this.actifForm.value);
      console.log('📋 Valeurs RAW après patch:', this.actifForm.getRawValue());

      // Gérer la géométrie si elle existe
      if (actif.geometry && actif.geometry.coordinates) {
        console.log('🗺️ Géométrie trouvée:', actif.geometry);
        console.log('🔍 Type géométrie:', actif.geometry.type);
        console.log('📍 Coordonnées:', actif.geometry.coordinates);
        
        this.actifForm.patchValue({
          geometryType: actif.geometry.type,
          coordinates: actif.geometry.coordinates
        });
        
        this.hasGeometry = true;
        console.log('✅ Géométrie chargée dans le formulaire');
        console.log('🗺️ hasGeometry:', this.hasGeometry);
        
        // Attendre que la carte soit prête puis afficher
        this.waitForMapAndDisplayGeometry(actif.geometry);
      } else {
        console.log('⚠️ Aucune géométrie trouvée');
        this.hasGeometry = false;
      }
      
      // ✅ IMPORTANT: Mettre à jour les états des contrôles après le chargement
      setTimeout(() => {
        this.updateFormControlsState();
        console.log('🔧 États des contrôles mis à jour');
        console.log('🔒 Code disabled:', this.actifForm.get('code')?.disabled);
        console.log('🔒 Groupe disabled:', this.actifForm.get('idGroupe')?.disabled);
      }, 100);
      
      this.snackBar.open(`🔍 Données de "${actif.nom}" chargées pour modification`, '', { 
        duration: 3000,
        panelClass: ['info-snackbar']
      });
      
      console.log('✅ === FIN loadActifForEdit ===');
      
    } catch (error) {
      console.error('❌ Erreur dans loadActifForEdit:', error);
      console.error('📋 Actif problématique:', actif);
    }
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
    console.log('🚀 === DEBUT performSave ===');
    this.isSaving = true;
    
    try {
      // Debug avant extraction des données
      console.log('📋 État du formulaire avant save:');
      console.log('📋 Valeurs:', this.actifForm.value);
      console.log('📋 Valeurs brutes:', this.actifForm.getRawValue());
      console.log('✅ Valide:', this.actifForm.valid);
      console.log('❌ Invalide:', this.actifForm.invalid);
      
      const formValue = this.actifForm.getRawValue();
      console.log('📋 Valeurs brutes extraites:', JSON.stringify(formValue, null, 2));
      
      // Construire les données à envoyer
      const actifData: CreateActifDto = {
        ...formValue,
        idGroupe: Number(formValue.idGroupe)
      };
      
      console.log('📦 Données finales à envoyer:', JSON.stringify(actifData, null, 2));
      console.log('🎯 Mode:', this.isEditMode ? 'EDITION' : 'CREATION');
      console.log('🆔 ID actif (si édition):', this.data?.actif?.id);

      if (this.isEditMode && this.data?.actif?.id) {
        console.log('✏️ === MISE À JOUR ACTIF ===');
        console.log('🔢 ID actif à modifier:', this.data.actif.id);
        console.log('📝 Données originales:', this.data.actif);
        console.log('📝 Données modifiées:', actifData);
        
        this.actifsService.updateActif(this.data.actif.id, actifData).subscribe({
          next: (updatedActif) => {
            console.log('✅ Actif mis à jour avec succès:', updatedActif);
            this.handleSaveSuccess(updatedActif, 'modifié');
          },
          error: (error) => {
            console.error('❌ Erreur lors de la mise à jour:', error);
            this.handleSaveError(error);
          }
        });
      } else {
        console.log('➕ === CRÉATION ACTIF ===');
        
        this.actifsService.createActif(actifData).subscribe({
          next: (createdActif) => {
            console.log('✅ Actif créé avec succès:', createdActif);
            this.handleSaveSuccess(createdActif, 'créé');
          },
          error: (error) => {
            console.error('❌ Erreur lors de la création:', error);
            this.handleSaveError(error);
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Erreur dans performSave:', error);
      this.isSaving = false;
    }
  }

  private handleSaveSuccess(actif: any, action: string): void {
    this.isSaving = false;
    
    this.snackBar.open(
      `✓ Actif "${actif.nom}" ${action} avec succès!`,
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

  // Méthode pour les tooltips adaptatifs
  getInfoTooltip(): string {
    const geometryType = this.actifForm.get('geometryType')?.value;
    switch (geometryType) {
      case 'Point': return 'Coordonnées';
      case 'LineString': return 'Longueur';
      case 'Polygon': return 'Surface et périmètre';
      default: return 'Informations';
    }
  }

  // Méthode pour les labels de menu adaptatifs
  getInfoMenuLabel(): string {
    const geometryType = this.actifForm.get('geometryType')?.value;
    switch (geometryType) {
      case 'Point': return 'Voir les coordonnées';
      case 'LineString': return 'Voir la longueur';
      case 'Polygon': return 'Voir surface/périmètre';
      default: return 'Voir les informations';
    }
  }

  // Méthode pour les icônes adaptatifs
  getInfoIcon(): string {
    const geometryType = this.actifForm.get('geometryType')?.value;
    switch (geometryType) {
      case 'Point': return 'place';
      case 'LineString': return 'timeline';
      case 'Polygon': return 'crop_free';
      default: return 'straighten';
    }
  }

  // Méthode pour les titres adaptatifs
  getInfoTitle(): string {
    const geometryType = this.actifForm.get('geometryType')?.value;
    switch (geometryType) {
      case 'Point': return 'Coordonnées du point';
      case 'LineString': return 'Informations de la ligne';
      case 'Polygon': return 'Informations de la zone';
      default: return 'Informations géométriques';
    }
  }

  debugFormState(): void {
    console.log('🔍 === ÉTAT DU FORMULAIRE ===');
    console.log('📋 Valeurs:', this.actifForm.value);
    console.log('📋 Valeurs brutes:', this.actifForm.getRawValue());
    console.log('✅ Valide:', this.actifForm.valid);
    console.log('❌ Invalide:', this.actifForm.invalid);
    console.log('🔄 Dirty:', this.actifForm.dirty);
    console.log('👆 Touched:', this.actifForm.touched);
    console.log('🗺️ A géométrie:', this.hasGeometry);
    console.log('🔧 Mode édition:', this.isEditMode);
    
    // Vérifier chaque champ
    Object.keys(this.actifForm.controls).forEach(key => {
      const control = this.actifForm.get(key);
      console.log(`📝 ${key}:`, {
        value: control?.value,
        valid: control?.valid,
        errors: control?.errors,
        disabled: control?.disabled,
        touched: control?.touched
      });
    });
    
    console.log('🎯 Groupes disponibles:', this.groupeOptions);
  }
}