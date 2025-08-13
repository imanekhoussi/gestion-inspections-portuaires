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

      <!-- Content -->
      <mat-dialog-content>
        <div class="details-grid">
          <!-- Localisation -->
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

          <!-- Classification -->
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

          <!-- Géolocalisation -->
          <mat-card class="info-card full-width">
            <mat-card-header>
              <mat-icon mat-card-avatar>gps_fixed</mat-icon>
              <mat-card-title>Géolocalisation</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div *ngIf="actif.geometry; else noGeometry">
                <div class="detail-item">
                  <span class="label">Type:</span>
                  <span class="value">{{ getGeometryTypeLabel(actif.geometry.type) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Coordonnées:</span>
                  <span class="value coordinates">{{ getCoordinatesText() }}</span>
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
    
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
    }
    
    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .header-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
    }
    
    .header-content h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }
    
    .code {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 14px;
    }
    
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding: 16px 0;
    }
    
    .full-width {
      grid-column: 1 / -1;
    }
    
    .info-card {
      margin: 0;
    }
    
    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .detail-item:last-child {
      border-bottom: none;
    }
    
    .label {
      font-weight: 500;
      color: #666;
    }
    
    .value {
      color: #333;
    }
    
    .coordinates {
      font-family: monospace;
      font-size: 13px;
    }
    
    .geo-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
    
    .no-data {
      text-align: center;
      padding: 24px;
      color: #999;
    }
    
    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 8px;
    }
    
    mat-chip.etat-good {
      background-color: #4caf50 !important;
      color: white !important;
    }
    
    mat-chip.etat-average {
      background-color: #ff9800 !important;
      color: white !important;
    }
    
    mat-chip.etat-poor {
      background-color: #f44336 !important;
      color: white !important;
    }
    
    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      justify-content: flex-end;
      gap: 8px;
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