// src/app/components/inspection-details-dialog/inspection-details-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { InspectionsService } from '../../services/inspections.service';
import { 
  Inspection, 
  Livrable, 
  LogHistorique, 
  EtatInspection,
  RoleUtilisateur 
} from '../../../../models/inspection.interface';
import { ClotureInspectionDialogComponent } from './cloture-inspection-dialog.component';
import { ValidationInspectionDialogComponent } from './validation-inspection-dialog.component';

@Component({
  selector: 'app-inspection-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatListModule
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon>event</mat-icon>
        Détails de l'inspection
      </h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="dialog-content">
      <div *ngIf="loading" class="loading-container">
        <mat-progress-spinner diameter="50" mode="indeterminate"></mat-progress-spinner>
        <p>Chargement des détails...</p>
      </div>

      <div *ngIf="!loading && inspection" class="inspection-details">
        <!-- Basic Information -->
        <mat-card class="info-card">
          <mat-card-content>
            <div class="detail-row">
              <strong>Titre:</strong>
              <span>{{ inspection.titre }}</span>
            </div>

            <div class="detail-row">
              <strong>Statut:</strong>
              <mat-chip [ngClass]="getStatusClass(inspection.etat)">
                <mat-icon>{{ getStatusIcon(inspection.etat) }}</mat-icon>
                {{ inspectionsService.getEtatLabel(inspection.etat) }}
              </mat-chip>
            </div>

            <div class="detail-row">
              <strong>Date de début:</strong>
              <span>{{ formatDate(inspection.dateDebut) }}</span>
            </div>

            <div class="detail-row">
              <strong>Date de fin:</strong>
              <span>{{ formatDate(inspection.dateFin) }}</span>
            </div>

            <div class="detail-row" *ngIf="inspection.createur">
              <strong>Créé par:</strong>
              <span>{{ inspection.createur.nom }}</span>
            </div>

            <div class="detail-row" *ngIf="inspection.actifs && inspection.actifs.length > 0">
              <strong>Actifs:</strong>
              <div class="actifs-list">
                <mat-chip *ngFor="let actif of inspection.actifs" class="actif-chip">
                  {{ actif.nom }}
                  <span *ngIf="actif.site" class="actif-site"> ({{ actif.site }})</span>
                </mat-chip>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

<!-- ✅ CORRECTION: Les onglets ne s'affichent que si showFullDetails = true -->
<mat-tab-group *ngIf="showFullDetails" class="details-tabs">
  <mat-tab label="Historique">
    <div class="tab-content">
      <div *ngIf="historique.length === 0" class="empty-state">
        <mat-icon>history</mat-icon>
        <p>Aucun historique disponible</p>
      </div>
      
      <mat-list *ngIf="historique.length > 0">
        <!-- Votre contenu historique -->
      </mat-list>
    </div>
  </mat-tab>

  <mat-tab label="Livrables">
    <div class="tab-content">
      <div *ngIf="livrables.length === 0" class="empty-state">
        <mat-icon>attach_file</mat-icon>
        <p>Aucun livrable disponible</p>
      </div>

      <mat-list *ngIf="livrables.length > 0">
        <!-- Votre contenu livrables -->
      </mat-list>
    </div>
  </mat-tab>
</mat-tab-group>
      </div>

      <div *ngIf="!loading && error" class="error-state">
        <mat-icon color="warn">error</mat-icon>
        <p>{{ error }}</p>
        <button mat-button color="primary" (click)="loadInspectionDetails()">
          Réessayer
        </button>
      </div>
    </mat-dialog-content>

 <!-- Remplacez la section <mat-dialog-actions> dans votre template par ceci: -->

<mat-dialog-actions class="dialog-actions">
  <button mat-button mat-dialog-close>Fermer</button>
  
  <!-- Actions based on user role and inspection state -->
  <div class="action-buttons">

  <button *ngIf="canShowStartButton()" 
        mat-raised-button 
        color="accent" 
        (click)="demarrerInspection()">
  <mat-icon>play_arrow</mat-icon>
  Démarrer l'inspection
</button>
    
    <!-- POUR OPERATEUR: Bouton Clôturer quand inspection est EN_COURS -->
    <button *ngIf="canShowCloturerButton()" 
            mat-raised-button 
            color="primary" 
            (click)="openCloturerDialog()">
      <mat-icon>check_circle</mat-icon>
      Clôturer
    </button>

    <!-- POUR MAITRE_OUVRAGE: Boutons de validation quand inspection est CLOTUREE -->
    <div *ngIf="canShowValidationButtons()" class="validation-buttons">
      <button mat-raised-button 
              color="primary" 
              (click)="openValiderDialog()">
        <mat-icon>thumb_up</mat-icon>
        Valider
      </button>
      
      <button mat-raised-button 
              color="warn" 
              (click)="openRejeterDialog()">
        <mat-icon>thumb_down</mat-icon>
        Rejeter
      </button>
      
      <button mat-raised-button 
              (click)="openCommentaireDialog()">
        <mat-icon>comment</mat-icon>
        Commentaire
      </button>
    </div>

    <!-- POUR TOUS: Bouton voir détails quand inspection terminée -->
    <button *ngIf="isInspectionCompleted()" 
            mat-raised-button 
            color="accent" 
            (click)="viewFullDetails()">
      <mat-icon>visibility</mat-icon>
      Voir tous les détails
    </button>


  </div>
</mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding: 0 24px;
      
      h2 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        color: #1976d2;
      }
    }

    .dialog-content {
      min-width: 600px;
      max-width: 800px;
      max-height: 70vh;
      overflow: auto;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      gap: 16px;
    }

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      gap: 16px;
      text-align: center;
    }

    .info-card {
      margin-bottom: 24px;
    }

    .detail-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 16px;

      strong {
        color: #333;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      span {
        font-size: 1rem;
        color: #666;
      }
    }

    .actifs-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;

      .actif-chip {
        background-color: #f5f5f5 !important;
        
        .actif-site {
          color: #666;
          font-size: 0.8rem;
        }
      }
    }

    .details-tabs {
      .tab-content {
        padding: 16px 0;
        min-height: 200px;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px;
        gap: 16px;
        color: #666;

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
        }
      }
    }

    .log-entry {
      width: 100%;
      padding: 8px 0;

      .log-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;

        .log-action {
          font-weight: 500;
          color: #333;
        }

        .log-date {
          font-size: 0.8rem;
          color: #666;
        }
      }

      .log-user {
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 4px;
      }

      .log-comment {
        font-style: italic;
        color: #555;
        background-color: #f5f5f5;
        padding: 8px;
        border-radius: 4px;
        border-left: 3px solid #1976d2;
      }
    }

    .livrable-entry {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 8px 0;

      .livrable-info {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;

        .file-icon {
          color: #666;
        }

        .file-details {
          .file-name {
            font-weight: 500;
            color: #333;
          }

          .file-meta {
            font-size: 0.8rem;
            color: #666;
          }
        }
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;

      .action-buttons {
        display: flex;
        gap: 8px;

        .validation-buttons {
          display: flex;
          gap: 8px;
        }

        button mat-icon {
          margin-right: 8px;
        }
      }
    }

    // Status chip styles
    .status-programmee {
      background-color: #e3f2fd !important;
      color: #1976d2 !important;
    }

    .status-en_cours {
      background-color: #fff3e0 !important;
      color: #f57c00 !important;
    }

    .status-cloturee {
      background-color: #f3e5f5 !important;
      color: #7b1fa2 !important;
    }

    .status-validee {
      background-color: #e8f5e8 !important;
      color: #388e3c !important;
    }

    .status-rejetee {
      background-color: #ffebee !important;
      color: #d32f2f !important;
    }

    @media (max-width: 768px) {
      .dialog-content {
        min-width: auto;
        max-width: 95vw;
      }

      .dialog-actions {
        flex-direction: column;
        gap: 16px;

        .action-buttons {
          width: 100%;

          button {
            flex: 1;
          }

          .validation-buttons {
            width: 100%;

            button {
              flex: 1;
            }
          }
        }
      }
    }
  `]
})
export class InspectionDetailsDialogComponent implements OnInit {
  inspection: Inspection | null = null;
  livrables: Livrable[] = [];
  historique: LogHistorique[] = [];
  loading = true;
  error: string | null = null;
  showFullDetails = false;

  constructor(
    public dialogRef: MatDialogRef<InspectionDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { inspectionId: number },
    public inspectionsService: InspectionsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadInspectionDetails();
  }

loadInspectionDetails(): void {
  this.loading = true;
  this.error = null;

  const inspectionId = this.data.inspectionId;

  // ✅ CORRECTION: Ne charger QUE l'inspection, pas les livrables/historique
  this.inspectionsService.getInspectionById(inspectionId)
    .pipe(
      finalize(() => this.loading = false)
    )
    .subscribe({
      next: (inspection) => {
        this.inspection = inspection;
        // ✅ Laisser les tableaux vides - ils se rempliront quand on clique "Voir détails"
        this.livrables = [];
        this.historique = [];
      },
      error: (err) => {
        this.error = err.message || 'Erreur lors du chargement des détails';
      }
    });
}

 canShowCloturerButton(): boolean {
  const userCanClose = this.inspectionsService.canUserCloseInspection();
  const isEnCours = this.inspection?.etat === 'en_cours';
  
 
  return isEnCours && userCanClose;
}

canShowValidationButtons(): boolean {
  const userCanValidate = this.inspectionsService.canUserValidateInspection();
  const isCloturee = this.inspection?.etat === 'cloturee';  // Changez de EtatInspection.CLOTUREE vers 'cloturee'
  return isCloturee && userCanValidate;
}

demarrerInspection(): void {
  if (!this.inspection) return;

  // Utilise le nouvel endpoint spécifique
  this.inspectionsService.demarrerInspection(this.inspection.id)
    .subscribe({
      next: (updatedInspection) => {
        this.inspection = updatedInspection;
        this.showSnackBar('Inspection démarrée', 'success');
      },
      error: (error) => {
        this.showSnackBar('Erreur lors du démarrage', 'error');
      }
    });
}

 isInspectionCompleted(): boolean {
  return this.inspection?.etat === 'validee' || 
         this.inspection?.etat === 'rejetee' ||
         this.inspection?.etat === 'cloturee'; 
}
  

  // Dialog actions
  openCloturerDialog(): void {
    if (!this.inspection) return;

    const dialogRef = this.dialog.open(ClotureInspectionDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: { inspection: this.inspection },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.showSnackBar('Inspection clôturée avec succès', 'success');
        this.loadInspectionDetails(); // Reload to show updated status
      }
    });
  }

  openValiderDialog(): void {
    if (!this.inspection) return;

    const dialogRef = this.dialog.open(ValidationInspectionDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: { 
        inspection: this.inspection, 
        action: 'valider' 
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.showSnackBar('Inspection validée avec succès', 'success');
        this.loadInspectionDetails();
      }
    });
  }

  openRejeterDialog(): void {
    if (!this.inspection) return;

    const dialogRef = this.dialog.open(ValidationInspectionDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: { 
        inspection: this.inspection, 
        action: 'rejeter' 
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.showSnackBar('Inspection rejetée', 'warning');
        this.loadInspectionDetails();
      }
    });
  }

  openCommentaireDialog(): void {
    // Simple comment dialog - could be implemented as a separate component
    // For now, just open the validation dialog in comment mode
    if (!this.inspection) return;

    const dialogRef = this.dialog.open(ValidationInspectionDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: { 
        inspection: this.inspection, 
        action: 'commentaire' 
      },
      disableClose: true
    });
  }

 viewFullDetails(): void {
   this.showFullDetails = true;
  // ✅ CORRECTION: Charger les données au lieu de naviguer
  this.loading = true;
  
  const inspectionId = this.data.inspectionId;

  forkJoin({
    livrables: this.inspectionsService.getInspectionLivrables(inspectionId).pipe(
      catchError(() => [])
    ),
    historique: this.inspectionsService.getInspectionHistorique(inspectionId).pipe(
      catchError(() => [])
    )
  }).pipe(
    finalize(() => this.loading = false)
  ).subscribe({
    next: (result) => {
      this.livrables = result.livrables;
      this.historique = result.historique.sort((a, b) => 
        new Date(b.dateIntervention).getTime() - new Date(a.dateIntervention).getTime()
      );
    },
    error: (err) => {
      console.error('Erreur lors du chargement des détails:', err);
    }
  });
}

  downloadLivrable(livrable: Livrable): void {
    if (!this.inspection) return;

    this.inspectionsService.downloadLivrable(this.inspection.id, livrable.id)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = livrable.originalName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          this.showSnackBar('Erreur lors du téléchargement', 'error');
        }
      });
  }

  canShowStartButton(): boolean {
  const userCanStart = this.inspectionsService.canUserCloseInspection();
  const isProgrammee = this.inspection?.etat === 'programmee';
  return isProgrammee && userCanStart;
}

  // Helper methods
  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  getStatusClass(etat: EtatInspection): string {
    return `status-${etat.toLowerCase()}`;
  }

  getStatusIcon(etat: EtatInspection): string {
    switch (etat) {
      case EtatInspection.PROGRAMMEE: return 'schedule';
      case EtatInspection.EN_COURS: return 'play_circle';
      case EtatInspection.CLOTUREE: return 'pause_circle';
      case EtatInspection.VALIDEE: return 'check_circle';
      case EtatInspection.REJETEE: return 'cancel';
      default: return 'help';
    }
  }

  getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'picture_as_pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'image';
      case 'doc':
      case 'docx': return 'description';
      case 'xls':
      case 'xlsx': return 'table_chart';
      case 'zip':
      case 'rar': return 'archive';
      default: return 'attach_file';
    }
  }

  private showSnackBar(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: [`snackbar-${type}`]
    });
  }
}