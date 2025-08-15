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
import { Draw } from 'ol/interaction';
import { Style, Fill, Stroke, Circle } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import { Geometry } from 'ol/geom';

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

@Component({
  selector: 'app-actif-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, 
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, 
    MatTooltipModule, MatProgressSpinnerModule, MatSnackBarModule, 
    MatMenuModule
  ],
  templateUrl: './actif-form-dialog.html',
  styleUrls: ['./actif-form-dialog.scss']
})
export class ActifFormDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  actifForm: FormGroup;
  isSaving = false;
  hasGeometry = false;
  isSatelliteView = false;

  isEditMode = false;
  dialogTitle = 'Créer un nouvel actif';

  private map!: Map;
  private drawSource = new VectorSource();
  private drawInteraction?: Draw;
  private osmLayer!: TileLayer<OSM>;
  private satelliteLayer!: TileLayer<XYZ>;

  private readonly TANGER_MED_COORDS: [number, number] = [-5.526, 35.88];
  private readonly DEFAULT_ZOOM = 14;

  // Enhanced dropdown options with better UX
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

  groupeOptions: DropdownOption[] = []; // Sera rempli depuis la BDD
  isLoadingGroupes = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ActifFormDialogComponent>,
    private actifsService: ActifsService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data?: { actif?: Actif, mode?: 'create' | 'edit' }
  ) {
    // Initialize form in constructor to avoid TypeScript error
    this.actifForm = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-_]+$/), Validators.maxLength(50)]],
      site: ['', Validators.required],
      zone: ['', Validators.required],
      ouvrage: ['', Validators.required],
      idGroupe: [null, [Validators.required]],
      geometryType: [null, Validators.required],
      coordinates: [null, Validators.required],
    });
  }

  ngOnInit(): void {
  this.setupFormValidation();
  
  console.log('🔍 Données reçues dans le dialog:', this.data);
  
  this.isEditMode = this.data?.mode === 'edit' || !!this.data?.actif;
  this.dialogTitle = this.isEditMode ? 'Modifier l\'actif' : 'Créer un nouvel actif';
  
  console.log('🔍 Mode détecté:', this.isEditMode ? 'EDITION' : 'CREATION');
  
  // 🔥 CORRECTION: Charger les groupes AVANT de charger les données
  this.loadGroupesFromDatabase(() => {
    if (this.isEditMode && this.data?.actif) {
      console.log('⚡ Chargement des données pour édition:', this.data.actif);
      this.loadActifForEdit(this.data.actif);
    }
  });
}

  ngAfterViewInit(): void {
    // Delay map initialization to ensure DOM is ready
    setTimeout(() => this.initializeMap(), 150);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.setTarget(undefined);
    }
  }

  private setupFormValidation(): void {
    // Add real-time validation feedback
    this.actifForm.get('code')?.valueChanges.subscribe(value => {
      if (value) {
        this.actifForm.get('code')?.setValue(value.toUpperCase(), { emitEvent: false });
      }
    });

    // Auto-generate code suggestion based on other fields
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

  private initializeMap(): void {
    this.createBaseLayers();
    this.createDrawLayer();
    this.setupMap();
  }

  private createBaseLayers(): void {
    this.osmLayer = new TileLayer({ 
      source: new OSM(),
      visible: true
    });
    
    this.satelliteLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: 'Tiles © Esri — Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
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

    // Add loading indicator
    this.map.on('loadstart', () => {
      this.showMapLoading(true);
    });

    this.map.on('loadend', () => {
      this.showMapLoading(false);
    });
  }

  private showMapLoading(isLoading: boolean): void {
    // You can implement a loading overlay here if needed
    console.log(isLoading ? 'Map loading...' : 'Map loaded');
  }

  startDrawing(type: 'Point' | 'LineString' | 'Polygon'): void {
    if (this.hasGeometry) {
      if (!this.confirmGeometryReplacement()) return;
    }

    this.clearDrawing(true);
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
    }) as GeoJsonGeometry;

    this.updateFormGeometry(geometryObject);
    this.finalizeDrawing(geometryObject.type);
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

  editGeometry(): void {
    const currentType = this.actifForm.get('geometryType')?.value;
    if (currentType) {
      this.startDrawing(currentType);
    }
  }

  deleteGeometry(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer la géométrie ?')) {
      this.clearDrawing(false);
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
    // Implement smooth scrolling to the error field
    const element = document.querySelector(`[formControlName="${fieldName}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // 🔥 CORRECTION 7: Améliorer la sauvegarde
  private performSave(): void {
    this.isSaving = true;
    
    // Récupérer les données du formulaire, en incluant le code même s'il est désactivé
    const formValue = this.actifForm.getRawValue();
    const actifData: CreateActifDto = {
      ...formValue,
      idGroupe: Number(formValue.idGroupe)
    };

    console.log('🚀 Données envoyées:', actifData);
    console.log('🎯 Mode:', this.isEditMode ? 'EDITION' : 'CREATION');

    if (this.isEditMode && this.data?.actif?.id) {
      // Mode édition
      console.log('✏️ Mise à jour de l\'actif ID:', this.data.actif.id);
      this.actifsService.updateActif(this.data.actif.id, actifData).subscribe({
        next: (updatedActif) => this.handleSaveSuccess(updatedActif, 'modifié'),
        error: (error) => this.handleSaveError(error)
      });
    } else {
      // Mode création
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

  // Utility methods
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

  // 🔥 CORRECTION 3: Modifier la méthode loadGroupesFromDatabase pour accepter un callback
  private loadGroupesFromDatabase(callback?: () => void): void {
    this.isLoadingGroupes = true;
    
    this.actifsService.getGroupes().subscribe({
      next: (groupes) => {
        console.log('✅ Groupes chargés depuis la BDD:', groupes);
        
        this.groupeOptions = groupes.map(groupe => ({
          value: groupe.id,
          label: groupe.nom,
          icon: this.getGroupeIcon(groupe.nom)
        }));
        
        this.isLoadingGroupes = false;
        
        this.snackBar.open(
          `✅ ${groupes.length} groupes chargés`, 
          '', 
          { duration: 2000 }
        );

        // 🔥 Appeler le callback une fois les groupes chargés
        if (callback) {
          callback();
        }
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des groupes:', error);
        this.isLoadingGroupes = false;
        
        // Valeurs par défaut
        this.groupeOptions = [
          { value: 1, label: 'Quais et Appontements', icon: 'anchor' },
          { value: 2, label: 'Digues et Jetées', icon: 'waves' },
          { value: 3, label: 'Grues Portuaires', icon: 'construction' },
          { value: 4, label: 'Portiques', icon: 'view_column' },
          { value: 5, label: 'Éclairage de Sécurité', icon: 'light_mode' },
          { value: 6, label: 'Transformateurs', icon: 'electrical_services' },
          { value: 7, label: 'Tableaux Électriques', icon: 'developer_board' }
        ];
        
        this.snackBar.open(
          '⚠️ Impossible de charger les groupes. Utilisation des valeurs par défaut.', 
          'Fermer', 
          { duration: 5000 }
        );

        // 🔥 Appeler le callback même en cas d'erreur
        if (callback) {
          callback();
        }
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

  // 🔥 CORRECTION 4: Améliorer la méthode loadActifForEdit
  private loadActifForEdit(actif: Actif): void {
  console.log('📄 Chargement des données de l\'actif pour édition:', actif);
  
  // 🔥 CORRECTION: Utiliser setValue au lieu de patchValue pour être plus strict
  this.actifForm.patchValue({
    nom: actif.nom || '',
    code: actif.code || '',
    site: actif.site || '',
    zone: actif.zone || '',
    ouvrage: actif.ouvrage || '',
    idGroupe: actif.idGroupe || actif.groupe?.id || null
  });

  console.log('📋 Valeurs du formulaire après chargement:', this.actifForm.value);
  console.log('📋 Raw values (incluant champs désactivés):', this.actifForm.getRawValue());

  // Charger la géométrie si elle existe
  if (actif.geometry && actif.geometry.coordinates) {
    this.actifForm.patchValue({
      geometryType: actif.geometry.type,
      coordinates: actif.geometry.coordinates
    });
    
    this.hasGeometry = true;
    console.log('🗺️ Géométrie chargée:', actif.geometry);
    
    // 🔥 ATTENDRE que la carte soit initialisée avant d'afficher la géométrie
    this.waitForMapAndDisplayGeometry(actif.geometry);
  }
  
  // 🔥 CORRECTION: Ne pas désactiver le code, juste l'afficher comme readonly dans le template
  // this.actifForm.get('code')?.disable(); // Commenté pour éviter les problèmes
  
  this.snackBar.open(`📝 Données de "${actif.nom}" chargées pour modification`, '', { 
    duration: 3000,
    panelClass: ['info-snackbar']
  });
}

private waitForMapAndDisplayGeometry(geometry: any): void {
  // Vérifier si la carte est initialisée
  const checkMapAndDisplay = () => {
    if (this.map) {
      console.log('✅ Carte initialisée, affichage de la géométrie...');
      this.displayExistingGeometry(geometry);
    } else {
      console.log('⏳ Carte pas encore initialisée, nouvelle tentative dans 200ms...');
      setTimeout(checkMapAndDisplay, 200);
    }
  };
  
  // Commencer à vérifier après un petit délai
  setTimeout(checkMapAndDisplay, 300);
}

  // 🔥 CORRECTION 6: Nouvelle méthode pour afficher la géométrie existante sur la carte
  private displayExistingGeometry(geometry: any): void {
    if (!this.map || !geometry) return;

    try {
      // Convertir la géométrie en feature OpenLayers
      const geoJsonFormat = new GeoJSON();
      const featureOrFeatures = geoJsonFormat.readFeature({
        type: 'Feature',
        geometry: geometry
      }, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      });

      // S'assurer qu'on a une seule feature (pas un tableau)
      const feature = Array.isArray(featureOrFeatures) ? featureOrFeatures[0] : featureOrFeatures;

      // Vérifier que la feature est valide
      if (!feature) {
        console.error('❌ Impossible de créer la feature depuis la géométrie');
        return;
      }

      // Ajouter la feature à la source de dessin
      this.drawSource.addFeature(feature);

      // Obtenir la géométrie de la feature
      const featureGeometry = feature.getGeometry();
      if (featureGeometry) {
        // Centrer la carte sur la géométrie
        const extent = featureGeometry.getExtent();
        if (extent && extent.length === 4) {
          this.map.getView().fit(extent, {
            padding: [50, 50, 50, 50],
            maxZoom: 18,
            duration: 1000
          });
        }
      }

      console.log('✅ Géométrie affichée sur la carte');
    } catch (error) {
      console.error('❌ Erreur lors de l\'affichage de la géométrie:', error);
      
      // Fallback: centrer sur les coordonnées si disponibles
      this.fallbackCenterOnCoordinates(geometry);
    }
  }

  // Méthode de fallback pour centrer sur les coordonnées
  private fallbackCenterOnCoordinates(geometry: any): void {
    try {
      if (geometry.type === 'Point' && geometry.coordinates) {
        const [lng, lat] = geometry.coordinates;
        const center = fromLonLat([lng, lat]);
        this.map.getView().animate({
          center: center,
          zoom: 16,
          duration: 1000
        });
        console.log('✅ Centrage de fallback réussi sur les coordonnées:', lng, lat);
      }
    } catch (error) {
      console.error('❌ Erreur dans le fallback:', error);
    }
  }
}