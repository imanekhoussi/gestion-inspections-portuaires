// src/app/components/inspection-details-dialog/validation-inspection-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { finalize } from 'rxjs/operators';

import { InspectionsService } from '../../services/inspections.service';
import { 
  Inspection, 
  ValiderInspectionDto, 
  RejeterInspectionDto 
} from '../../../../models/inspection.interface';

@Component({
  selector: 'app-validation-inspection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon [color]="getActionColor()">{{ getActionIcon() }}</mat-icon>
        {{ getActionTitle() }}
      </h2>
      <button mat-icon-button mat-dialog-close [disabled]="isSubmitting">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="dialog-content">
      <!-- Inspection Summary -->
      <mat-card class="inspection-summary">
        <mat-card-content>
          <div class="summary-row">
            <strong>Inspection:</strong>
            <span>{{ inspection.titre }}</span>
          </div>
          <div class="summary-row">
            <strong>Statut actuel:</strong>
            <mat-chip class="status-chip">
              {{ inspectionsService.getEtatLabel(inspection.etat) }}
            </mat-chip>
          </div>
          <div class="summary-row" *ngIf="inspection.cloturedBy">
            <strong>Clôturée par:</strong>
            <span>{{ getClotureInfo() }}</span>
          </div>
          <div class="summary-row" *ngIf="inspection.commentaireCloture">
            <strong>Commentaire de clôture:</strong>
            <div class="cloture-comment">{{ inspection.commentaireCloture }}</div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Action Form -->
      <form [formGroup]="validationForm" class="validation-form">
        <mat-card>
          <mat-card-header>
            <mat-card-title>{{ getFormTitle() }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            
            <!-- Validation Comment (optional) -->
            <mat-form-field *ngIf="action === 'valider'" class="full-width">
              <mat-label>Commentaire de validation (optionnel)</mat-label>
              <textarea matInput 
                        formControlName="commentaire" 
                        rows="4" 
                        placeholder="Observations sur la qualité de l'inspection...">
              </textarea>
            </mat-form-field>

            <!-- Rejection Reason (required) -->
            <mat-form-field *ngIf="action === 'rejeter'" class="full-width">
              <mat-label>Motif de rejet *</mat-label>
              <textarea matInput 
                        formControlName="motifRejet" 
                        rows="4" 
                        placeholder="Expliquez les raisons du rejet (obligatoire)..."
                        required>
              </textarea>
              <mat-error *ngIf="validationForm.get('motifRejet')?.hasError('required')">
                Le motif de rejet est obligatoire
              </mat-error>
            </mat-form-field>

            <!-- General Comment -->
            <mat-form-field *ngIf="action === 'commentaire'" class="full-width">
              <mat-label>Commentaire</mat-label>
              <textarea matInput 
                        formControlName="commentaire" 
                        rows="4" 
                        placeholder="Votre commentaire...">
              </textarea>
            </mat-form-field>

            <!-- Warning for rejection -->
            <div *ngIf="action === 'rejeter'" class="warning-box">
              <mat-icon>warning</mat-icon>
              <div class="warning-text">
                <strong>Attention :</strong> Le rejet de cette inspection nécessitera une nouvelle programmation par l'opérateur. Assurez-vous que le motif est clairement expliqué.
              </div>
            </div>

            <!-- Success message for validation -->
            <div *ngIf="action === 'valider'" class="info-box">
              <mat-icon>info</mat-icon>
              <div class="info-text">
                La validation marquera cette inspection comme terminée avec succès.
              </div>
            </div>

          </mat-card-content>
        </mat-card>
      </form>

      <!-- Action Summary -->
      <mat-card *ngIf="action !== 'commentaire'" class="action-summary">
        <mat-card-header>
          <mat-card-title>Résumé de l'action</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="action-details">
            <div class="detail-item">
              <strong>Action:</strong>
              <span>{{ getActionSummary() }}</span>
            </div>
            <div class="detail-item">
              <strong>Utilisateur:</strong>
              <span>{{ getCurrentUserName() }}</span>
            </div>
            <div class="detail-item">
              <strong>Date/Heure:</strong>
              <span>{{ getCurrentDateTime() }}</span>
            </div>
            <div class="detail-item" *ngIf="action === 'valider'">
              <strong>Nouveau statut:</strong>
              <mat-chip class="status-validee">Validée</mat-chip>
            </div>
            <div class="detail-item" *ngIf="action === 'rejeter'">
              <strong>Nouveau statut:</strong>
              <mat-chip class="status-rejetee">Rejetée</mat-chip>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-button 
              mat-dialog-close 
              [disabled]="isSubmitting">
        Annuler
      </button>
      
      <button *ngIf="action !== 'commentaire'"
              mat-raised-button 
              [color]="getActionColor()" 
              (click)="onSubmit()"
              [disabled]="isSubmitting || validationForm.invalid">
        <mat-progress-spinner *ngIf="isSubmitting" 
                              diameter="20" 
                              mode="indeterminate">
        </mat-progress-spinner>
        <mat-icon *ngIf="!isSubmitting">{{ getActionIcon() }}</mat-icon>
        {{ getSubmitButtonText() }}
      </button>

      <button *ngIf="action === 'commentaire'"
              mat-raised-button 
              color="primary" 
              mat-dialog-close>
        <mat-icon>close</mat-icon>
        Fermer
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      h2 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
      }
    }

    .dialog-content {
      min-width: 500px;
      max-width: 700px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .inspection-summary {
      margin-bottom: 24px;
      background-color: #f8f9fa;

      .summary-row {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 12px;

        strong {
          color: #333;
          font-size: 0.9rem;
        }

        span {
          color: #666;
        }

        .cloture-comment {
          background-color: #fff;
          padding: 12px;
          border-radius: 4px;
          border-left: 3px solid #1976d2;
          margin-top: 8px;
          font-style: italic;
        }
      }

      .status-chip {
        background-color: #f3e5f5 !important;
        color: #7b1fa2 !important;
      }
    }

    .validation-form {
      margin-bottom: 24px;
    }

    .full-width {
      width: 100%;
    }

    .warning-box {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background-color: #fff3e0;
      border: 1px solid #ffb74d;
      border-radius: 4px;
      margin-top: 16px;

      mat-icon {
        color: #ff9800;
        margin-top: 2px;
      }

      .warning-text {
        flex: 1;
        color: #e65100;
        
        strong {
          display: block;
          margin-bottom: 4px;
        }
      }
    }

    .info-box {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background-color: #e3f2fd;
      border: 1px solid #64b5f6;
      border-radius: 4px;
      margin-top: 16px;

      mat-icon {
        color: #1976d2;
        margin-top: 2px;
      }

      .info-text {
        flex: 1;
        color: #0d47a1;
      }
    }

    .action-summary {
      background-color: #f8f9fa;

      .action-details {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;

          &:last-child {
            border-bottom: none;
          }

          strong {
            color: #333;
          }

          span {
            color: #666;
          }
        }
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      margin-top: 24px;

      button mat-icon {
        margin-right: 8px;
      }
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

      .action-details .detail-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }
  `]
})
export class ValidationInspectionDialogComponent implements OnInit {
  validationForm: FormGroup;
  isSubmitting = false;

  constructor(
    public dialogRef: MatDialogRef<ValidationInspectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      inspection: Inspection; 
      action: 'valider' | 'rejeter' | 'commentaire' 
    },
    private fb: FormBuilder,
    public inspectionsService: InspectionsService,
    private snackBar: MatSnackBar
  ) {
    this.validationForm = this.createForm();
  }

  get inspection(): Inspection {
    return this.data.inspection;
  }

  get action(): 'valider' | 'rejeter' | 'commentaire' {
    return this.data.action;
  }

  ngOnInit(): void {
    // Form is already created in constructor
  }

  private createForm(): FormGroup {
    const formConfig: any = {};

    if (this.data.action === 'valider') {
      formConfig.commentaire = [''];
    } else if (this.data.action === 'rejeter') {
      formConfig.motifRejet = ['', Validators.required];
    } else if (this.data.action === 'commentaire') {
      formConfig.commentaire = [''];
    }

    return this.fb.group(formConfig);
  }

  onSubmit(): void {
    if (this.validationForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    if (this.action === 'valider') {
      this.validerInspection();
    } else if (this.action === 'rejeter') {
      this.rejeterInspection();
    }
  }

  private validerInspection(): void {
    const validerDto: ValiderInspectionDto = {
      commentaire: this.validationForm.get('commentaire')?.value || undefined
    };

    this.inspectionsService.validerInspection(this.inspection.id, validerDto)
      .pipe(
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: (updatedInspection) => {
          this.dialogRef.close({ 
            success: true, 
            inspection: updatedInspection,
            action: 'valider' 
          });
        },
        error: (error) => {
          this.snackBar.open(
            error.message || 'Erreur lors de la validation', 
            'Fermer', 
            { duration: 5000, panelClass: ['snackbar-error'] }
          );
        }
      });
  }

  private rejeterInspection(): void {
    const rejeterDto: RejeterInspectionDto = {
      motifRejet: this.validationForm.get('motifRejet')?.value
    };

    this.inspectionsService.rejeterInspection(this.inspection.id, rejeterDto)
      .pipe(
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: (updatedInspection) => {
          this.dialogRef.close({ 
            success: true, 
            inspection: updatedInspection,
            action: 'rejeter' 
          });
        },
        error: (error) => {
          this.snackBar.open(
            error.message || 'Erreur lors du rejet', 
            'Fermer', 
            { duration: 5000, panelClass: ['snackbar-error'] }
          );
        }
      });
  }

  // UI Helper Methods
  getActionTitle(): string {
    switch (this.action) {
      case 'valider': return 'Valider l\'inspection';
      case 'rejeter': return 'Rejeter l\'inspection';
      case 'commentaire': return 'Ajouter un commentaire';
      default: return 'Action sur l\'inspection';
    }
  }

  getActionIcon(): string {
    switch (this.action) {
      case 'valider': return 'thumb_up';
      case 'rejeter': return 'thumb_down';
      case 'commentaire': return 'comment';
      default: return 'help';
    }
  }

  getActionColor(): string {
    switch (this.action) {
      case 'valider': return 'primary';
      case 'rejeter': return 'warn';
      case 'commentaire': return 'accent';
      default: return 'primary';
    }
  }

  getFormTitle(): string {
    switch (this.action) {
      case 'valider': return 'Confirmation de validation';
      case 'rejeter': return 'Motif de rejet';
      case 'commentaire': return 'Votre commentaire';
      default: return '';
    }
  }

  getActionSummary(): string {
    switch (this.action) {
      case 'valider': return 'Validation de l\'inspection';
      case 'rejeter': return 'Rejet de l\'inspection';
      default: return '';
    }
  }

  getSubmitButtonText(): string {
    if (this.isSubmitting) {
      switch (this.action) {
        case 'valider': return 'Validation en cours...';
        case 'rejeter': return 'Rejet en cours...';
        default: return 'Traitement...';
      }
    }

    switch (this.action) {
      case 'valider': return 'Valider l\'inspection';
      case 'rejeter': return 'Rejeter l\'inspection';
      default: return 'Confirmer';
    }
  }

  getClotureInfo(): string {
    if (this.inspection.cloturedAt) {
      return `Le ${this.formatDateTime(this.inspection.cloturedAt)}`;
    }
    return 'Information non disponible';
  }

  getCurrentDateTime(): string {
    return this.formatDateTime(new Date());
  }

  getCurrentUserName(): string {
    // This would come from your auth service
    return this.inspectionsService.getUserRole() || 'Utilisateur actuel';
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
}