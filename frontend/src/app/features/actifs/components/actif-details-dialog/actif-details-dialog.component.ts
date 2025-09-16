import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Actif } from '../../../../core/models/actif.interface';

@Component({
  selector: 'app-actif-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="details-dialog">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-content">
          <mat-icon class="header-icon">info</mat-icon>
          <div>
            <h2>{{ actif.nom }}</h2>
            <p class="code">Code: {{ actif.code }}</p>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <div class="details-grid">
          <mat-card class="info-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>location_on</mat-icon>
              <mat-card-title>Localisation</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="detail-item">
                <span class="label">Site:</span>
                <span class="value">{{ actif.site }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Zone:</span>
                <span class="value">{{ actif.zone }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Type:</span>
                <span class="value">{{ actif.ouvrage }}</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="info-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>category</mat-icon>
              <mat-card-title>Classification</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="detail-item">
                <span class="label">Groupe:</span>
                <span class="value">{{ actif.groupe?.nom || 'Non défini' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">État:</span>
                <mat-chip [class]="getEtatClass(actif.indiceEtat)">
                  {{ getEtatText(actif.indiceEtat) }} ({{ actif.indiceEtat }}/5)
                </mat-chip>
              </div>
            </mat-card-content>
          </mat-card>

<mat-card class="info-card full-width">
  <mat-card-header>
    <mat-icon mat-card-avatar>{{ getGeometryIcon() }}</mat-icon>
    <mat-card-title>{{ getGeometryTitle() }}</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <div *ngIf="actif.geometry; else noGeometry">
      <div class="detail-item">
        <span class="label">Type:</span>
        <span class="value">{{ getGeometryTypeLabel(actif.geometry.type) }}</span>
      </div>

      
<div *ngIf="actif.geometry.type === 'Point'">
  <div class="detail-item">
    <span class="label">Latitude:</span>
    <span class="value coordinates">{{ getLatitude() }}</span>
  </div>
  <div class="detail-item">
    <span class="label">Longitude:</span>
    <span class="value coordinates">{{ getLongitude() }}</span>
  </div>
  
  <div class="geo-actions">
    <button mat-raised-button color="primary" (click)="openInMaps()">
      <mat-icon>map</mat-icon>
      Ouvrir dans Maps
    </button>
    <button mat-stroked-button (click)="copyCoordinates()">
      <mat-icon>copy</mat-icon>
      Copier
    </button>
  </div>
</div>
      <div *ngIf="actif.geometry.type === 'Polygon'" class="geometry-metrics">
        <div class="detail-item">
          <span class="label">Surface:</span>
          <span class="value highlight">{{ getSurfaceText() }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Périmètre:</span>
          <span class="value highlight">{{ getPerimetreText() }}</span>
        </div>
      </div>

      <!-- Pour les Lignes : Longueur -->
      <div *ngIf="actif.geometry.type === 'LineString'" class="geometry-metrics">
        <div class="detail-item">
          <span class="label">Longueur:</span>
          <span class="value highlight">{{ getLongueurText() }}</span>
        </div>
      </div>

    </div>
    <ng-template #noGeometry>
      <div class="no-data">
        <mat-icon>location_disabled</mat-icon>
        <p>Aucune géolocalisation disponible</p>
      </div>
    </ng-template>
  </mat-card-content>
</mat-card>
        </div>
      </mat-dialog-content>

      <!-- Actions -->
      <mat-dialog-actions>
        <button mat-button mat-dialog-close>Fermer</button>
        <button mat-raised-button color="primary" (click)="editActif()">
          <mat-icon>edit</mat-icon>
          Modifier
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
  .details-dialog {
    width: 100%;
    max-width: 700px;
  }
  
  .geometry-metrics {
    background: linear-gradient(135deg, #e8f4fd 0%, #f0f8ff 100%);
    border-radius: 8px;
    padding: 12px;
    margin: 12px 0;
    border-left: 4px solid #1976d2;
    box-shadow: 0 2px 4px rgba(25, 118, 210, 0.1);
  }

  .value.highlight {
    color: #1565c0;
    font-weight: 700;
    background: white;
    padding: 4px 12px;
    border-radius: 16px;
    border: 2px solid #1976d2;
    font-size: 14px;
  }
  
  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    color: white;
    border-bottom: none;
  }
  
  .header-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .header-icon {
    font-size: 36px;
    width: 36px;
    height: 36px;
    color: white;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    padding: 8px;
  }
  
  .header-content h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
    color: white;
  }
  
  .code {
    margin: 4px 0 0 0;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
  }
  
  .dialog-header button[mat-icon-button] {
    color: white;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }
  
  .dialog-header button[mat-icon-button]:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    padding: 20px;
    background: #f8f9fa;
  }
  
  .full-width {
    grid-column: 1 / -1;
  }
  
  .info-card {
    margin: 0;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    overflow: hidden;
  }
  
  .info-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }
  
  /* Couleurs différenciées pour les headers */
  .info-card:nth-child(1) mat-card-header {
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  }
  
  .info-card:nth-child(1) mat-card-avatar {
    background-color: #1976d2 !important;
    color: white !important;
  }
  
  .info-card:nth-child(2) mat-card-header {
    background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  }
  
  .info-card:nth-child(2) mat-card-avatar {
    background-color: #f57c00 !important;
    color: white !important;
  }
  
  .info-card:nth-child(3) mat-card-header {
    background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
  }
  
  .info-card:nth-child(3) mat-card-avatar {
    background-color: #388e3c !important;
    color: white !important;
  }
  
  mat-card-title {
    font-weight: 600 !important;
    color: #333 !important;
  }
  
  mat-card-header {
    padding: 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
  
  mat-card-content {
    padding: 18px;
  }
  
  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .detail-item:last-child {
    border-bottom: none;
  }
  
  .label {
    font-weight: 600;
    color: #555;
    font-size: 14px;
  }
  
  .value {
    color: #333;
    font-weight: 500;
  }
  
  .coordinates {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 13px;
    background: #f8f9fa;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
  }
  
  .geo-actions {
    display: flex;
    gap: 10px;
    margin-top: 18px;
    justify-content: center;
  }
  
  .geo-actions button {
    border-radius: 20px;
    font-weight: 500;
    text-transform: none;
  }
  
  .no-data {
    text-align: center;
    padding: 32px;
    color: #999;
  }
  
  .no-data mat-icon {
    font-size: 56px;
    width: 56px;
    height: 56px;
    margin-bottom: 12px;
    opacity: 0.5;
  }
  
  mat-chip.etat-good {
    background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%) !important;
    color: white !important;
    font-weight: 600 !important;
    border-radius: 16px !important;
  }
  
  mat-chip.etat-average {
    background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%) !important;
    color: white !important;
    font-weight: 600 !important;
    border-radius: 16px !important;
  }
  
  mat-chip.etat-poor {
    background: linear-gradient(135deg, #f44336 0%, #ef5350 100%) !important;
    color: white !important;
    font-weight: 600 !important;
    border-radius: 16px !important;
  }
  
  mat-dialog-actions {
    padding: 18px 24px;
    background: white;
    border-top: 1px solid #e0e0e0;
    justify-content: flex-end;
    gap: 10px;
  }
  
  mat-dialog-actions button {
    border-radius: 20px;
    font-weight: 600;
    text-transform: none;
    padding: 8px 20px;
  }
`]
})
export class ActifDetailsDialogComponent {
  
  constructor(
    public dialogRef: MatDialogRef<ActifDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { actif: Actif },
    private snackBar: MatSnackBar
  ) {}

  get actif(): Actif {
    return this.data.actif;
  }

  getEtatClass(indiceEtat: number): string {
    if (indiceEtat <= 2) return 'etat-poor';
    if (indiceEtat === 3) return 'etat-average';
    return 'etat-good';
  }

  getEtatText(indiceEtat: number): string {
    if (indiceEtat <= 2) return 'Mauvais';
    if (indiceEtat === 3) return 'Moyen';
    return 'Bon';
  }

  getGeometryTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'Point': 'Point',
      'LineString': 'Ligne',
      'Polygon': 'Zone'
    };
    return labels[type] || type;
  }


getLatitude(): string {
  if (!this.actif.geometry || this.actif.geometry.type !== 'Point') {
    return 'Non disponible';
  }
  
  const [lng, lat] = this.actif.geometry.coordinates as [number, number];
  return lat.toFixed(6);
}

getLongitude(): string {
  if (!this.actif.geometry || this.actif.geometry.type !== 'Point') {
    return 'Non disponible';
  }
  
  const [lng, lat] = this.actif.geometry.coordinates as [number, number];
  return lng.toFixed(6);
}
getGeometryTitle(): string {
  if (!this.actif.geometry) return 'Géolocalisation';
  
  switch (this.actif.geometry.type) {
    case 'Point':
      return 'Géolocalisation';
    case 'Polygon':
    case 'LineString':
      return 'Dimensions';
    default:
      return 'Géolocalisation';
  }
}

getGeometryIcon(): string {
  if (!this.actif.geometry) return 'gps_fixed';
  
  switch (this.actif.geometry.type) {
    case 'Point':
      return 'gps_fixed';
    case 'Polygon':
      return 'crop_free';  // Icône pour les zones
    case 'LineString':
      return 'timeline';   // Icône pour les lignes
    default:
      return 'gps_fixed';
  }
}

getLongueurText(): string {
  if (!this.actif.geometry || this.actif.geometry.type !== 'LineString') {
    return 'Non applicable';
  }
  
  const longueur = this.calculateLineStringLength();
  if (longueur > 1000) {
    return `${(longueur / 1000).toFixed(2)} km`;
  } else {
    return `${longueur.toFixed(0)} m`;
  }
}

private calculateLineStringLength(): number {
  if (!this.actif.geometry || this.actif.geometry.type !== 'LineString') {
    return 0;
  }
  
  const coordinates = this.actif.geometry.coordinates as number[][];
  let totalLength = 0;
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [x1, y1] = coordinates[i];
    const [x2, y2] = coordinates[i + 1];
    
    // Distance euclidienne entre deux points
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    totalLength += distance;
  }
  
  // Conversion approximative des degrés en mètres
  const metersPerDegree = 111320;
  return totalLength * metersPerDegree;
}
getSurfaceText(): string {
  if (!this.actif.geometry || this.actif.geometry.type !== 'Polygon') {
    return 'Non applicable';
  }
  
  const surface = this.calculatePolygonArea();
  if (surface > 10000) {
    return `${(surface / 10000).toFixed(2)} ha`;
  } else {
    return `${surface.toFixed(0)} m²`;
  }
}

getPerimetreText(): string {
  if (!this.actif.geometry || this.actif.geometry.type !== 'Polygon') {
    return 'Non applicable';
  }
  
  const perimetre = this.calculatePolygonPerimeter();
  if (perimetre > 1000) {
    return `${(perimetre / 1000).toFixed(2)} km`;
  } else {
    return `${perimetre.toFixed(0)} m`;
  }
}

private calculatePolygonArea(): number {
  if (!this.actif.geometry || this.actif.geometry.type !== 'Polygon') {
    return 0;
  }
  
  const coordinates = this.actif.geometry.coordinates as number[][][];
  const ring = coordinates[0]; // Premier anneau (extérieur)
  
  // Formule de Shoelace pour calculer l'aire d'un polygone
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += (x1 * y2) - (x2 * y1);
  }
  
  // Conversion approximative des degrés en mètres (pour les coordonnées géographiques)
  // Cette approximation fonctionne pour des zones relativement petites
  const metersPerDegree = 111320; // mètres par degré à l'équateur
  return Math.abs(area) / 2 * Math.pow(metersPerDegree, 2);
}

private calculatePolygonPerimeter(): number {
  if (!this.actif.geometry || this.actif.geometry.type !== 'Polygon') {
    return 0;
  }
  
  const coordinates = this.actif.geometry.coordinates as number[][][];
  const ring = coordinates[0]; // Premier anneau (extérieur)
  
  let perimeter = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    
    // Distance euclidienne entre deux points
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    perimeter += distance;
  }
  
  // Conversion approximative des degrés en mètres
  const metersPerDegree = 111320;
  return perimeter * metersPerDegree;
}

  getCoordinatesText(): string {
    if (!this.actif.geometry || !this.actif.geometry.coordinates) {
      return 'Non disponible';
    }

    const coords = this.actif.geometry.coordinates;
    
    if (this.actif.geometry.type === 'Point') {
      const [lng, lat] = coords as [number, number];
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } else if (this.actif.geometry.type === 'LineString') {
      const points = coords as number[][];
      return `${points.length} points`;
    } else if (this.actif.geometry.type === 'Polygon') {
      const rings = coords as number[][][];
      const pointCount = rings[0].length - 1;
      return `Polygone avec ${pointCount} sommets`;
    }
    
    return 'Format non reconnu';
  }

  openInMaps(): void {
    if (this.actif.geometry && this.actif.geometry.coordinates) {
      let lat: number, lng: number;
      
      if (this.actif.geometry.type === 'Point') {
        [lng, lat] = this.actif.geometry.coordinates as [number, number];
      } else if (this.actif.geometry.type === 'LineString') {
        [lng, lat] = (this.actif.geometry.coordinates as number[][])[0];
      } else if (this.actif.geometry.type === 'Polygon') {
        [lng, lat] = (this.actif.geometry.coordinates as number[][][])[0][0];
      } else {
        this.snackBar.open('Type de géométrie non supporté', 'Fermer', { duration: 3000 });
        return;
      }
      
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      window.open(url, '_blank');
    }
  }

  copyCoordinates(): void {
    const coordsText = this.getCoordinatesText();
    if (coordsText !== 'Non disponible' && coordsText !== 'Format non reconnu') {
      navigator.clipboard.writeText(coordsText).then(() => {
        this.snackBar.open('Coordonnées copiées !', '', { duration: 2000 });
      }).catch(() => {
        this.snackBar.open('Erreur lors de la copie', 'Fermer', { duration: 3000 });
      });
    }
  }

  editActif(): void {
    this.dialogRef.close('edit');
  }
}