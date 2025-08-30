// src/app/components/inspection-details-dialog/cloture-inspection-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatStepperModule } from '@angular/material/stepper';
import { finalize } from 'rxjs/operators';

import { InspectionsService } from '../../services/inspections.service';
import { 
  Inspection, 
  CloturerInspectionDto, 
  ActifConditionUpdateDto 
} from '../../../../models/inspection.interface';

@Component({
  selector: 'app-cloture-inspection-dialog',
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
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatListModule,
    MatChipsModule,
    MatStepperModule
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon>check_circle</mat-icon>
        Clôturer l'inspection
      </h2>
      <button mat-icon-button mat-dialog-close [disabled]="isSubmitting">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="dialog-content">
      <form [formGroup]="cloturerForm" class="cloture-form">
        
        <!-- Step 1: General Comments -->
        <mat-card class="step-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>comment</mat-icon>
              Commentaires généraux
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field class="full-width">
              <mat-label>Commentaire de clôture (optionnel)</mat-label>
              <textarea matInput 
                        formControlName="commentaire" 
                        rows="3" 
                        placeholder="Décrivez le déroulement de l'inspection...">
              </textarea>
            </mat-form-field>
          </mat-card-content>
        </mat-card>

        <!-- Step 2: File Upload -->
        <mat-card class="step-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>attach_file</mat-icon>
              Documents et images
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="upload-section">
              <div class="upload-zone" 
                   (click)="fileInput.click()"
                   (dragover)="onDragOver($event)"
                   (drop)="onDrop($event)"
                   [class.drag-over]="isDragOver">
                <mat-icon>cloud_upload</mat-icon>
                <p>Cliquez ou glissez-déposez vos fichiers ici</p>
                <small>Images (JPG, PNG, GIF), PDF, Documents (DOC, XLS)</small>
              </div>
              
              <input #fileInput 
                     type="file" 
                     multiple 
                     accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                     (change)="onFilesSelected($event)"
                     style="display: none;">

              <!-- Selected Files List -->
              <div *ngIf="selectedFiles.length > 0" class="selected-files">
                <h4>Fichiers sélectionnés :</h4>
                <mat-list>
                  <mat-list-item *ngFor="let file of selectedFiles; let i = index">
                    <mat-icon matListItemIcon>{{ getFileIcon(file.name) }}</mat-icon>
                    <div matListItemTitle>{{ file.name }}</div>
                    <div matListItemLine>{{ formatFileSize(file.size) }}</div>
                    <button mat-icon-button 
                            (click)="removeFile(i)"
                            matTooltip="Supprimer"
                            matListItemMeta>
                      <mat-icon>delete</mat-icon>
                    </button>
                  </mat-list-item>
                </mat-list>
              </div>

              <!-- Upload Progress -->
              <div *ngIf="isUploading" class="upload-progress">
                <mat-progress-spinner diameter="30" mode="indeterminate"></mat-progress-spinner>
                <span>Upload en cours...</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Step 3: Asset Condition Updates -->
        <mat-card class="step-card" *ngIf="inspection.actifs && inspection.actifs.length > 0">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>build</mat-icon>
              État des actifs (optionnel)
            </mat-card-title>
            <mat-card-subtitle>
              Mise à jour de l'indice d'état des actifs inspectés
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div formArrayName="actifsUpdates" class="actifs-updates">
              <div *ngFor="let actif of inspection.actifs; let i = index" 
                   class="actif-update-row">
                <div class="actif-info">
                  <strong>{{ actif.nom }}</strong>
                  <small *ngIf="actif.site">{{ actif.site }}</small>
                  <mat-chip *ngIf="actif.indiceEtat" 
                            [ngClass]="getIndiceEtatClass(actif.indiceEtat!)">
                    État actuel: {{ getIndiceEtatLabel(actif.indiceEtat!) }}
                  </mat-chip>
                </div>
                
                <div class="actif-controls" *ngIf="getActifUpdateFormGroup(i) as actifForm" 
                     [formGroup]="actifForm">
                  <mat-form-field>
                    <mat-label>Nouvel indice d'état</mat-label>
                    <mat-select formControlName="nouvelIndiceEtat">
                      <mat-option [value]="1">1 - Très mauvais</mat-option>
                      <mat-option [value]="2">2 - Mauvais</mat-option>
                      <mat-option [value]="3">3 - Moyen</mat-option>
                      <mat-option [value]="4">4 - Bon</mat-option>
                      <mat-option [value]="5">5 - Très bon</mat-option>
                    </mat-select>
                  </mat-form-field>
                  
                  <mat-form-field class="full-width">
                    <mat-label>Commentaire sur l'actif</mat-label>
                    <input matInput formControlName="commentaire" 
                           placeholder="Observations sur cet actif...">
                  </mat-form-field>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Date/Time Information -->
        <mat-card class="step-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>access_time</mat-icon>
              Informations temporelles
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="time-info">
              <div class="time-item">
                <strong>Date de début prévue:</strong>
                <span>{{ formatDateTime(inspection.dateDebut) }}</span>
              </div>
              <div class="time-item">
                <strong>Date de fin prévue:</strong>
                <span>{{ formatDateTime(inspection.dateFin) }}</span>
              </div>
              <div class="time-item">
                <strong>Clôture:</strong>
                <span>{{ getCurrentDateTime() }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-button 
              mat-dialog-close 
              [disabled]="isSubmitting">
        Annuler
      </button>
      
      <button mat-raised-button 
              color="primary" 
              (click)="onSubmit()"
              [disabled]="isSubmitting || cloturerForm.invalid">
        <mat-progress-spinner *ngIf="isSubmitting" 
                              diameter="20" 
                              mode="indeterminate">
        </mat-progress-spinner>
        <mat-icon *ngIf="!isSubmitting">check_circle</mat-icon>
        {{ isSubmitting ? 'Clôture en cours...' : 'Clôturer l\'inspection' }}
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
        color: #1976d2;
      }
    }

    .dialog-content {
      min-width: 700px;
      max-width: 900px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .cloture-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .step-card {
      mat-card-header {
        mat-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }
    }

    .full-width {
      width: 100%;
    }

    .upload-section {
      .upload-zone {
        border: 2px dashed #ccc;
        border-radius: 8px;
        padding: 32px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        background-color: #fafafa;

        &:hover {
          border-color: #1976d2;
          background-color: #f5f5f5;
        }

        &.drag-over {
          border-color: #1976d2;
          background-color: #e3f2fd;
        }

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: #666;
          margin-bottom: 16px;
        }

        p {
          margin: 0 0 8px 0;
          font-size: 1.1rem;
          color: #333;
        }

        small {
          color: #666;
        }
      }

      .selected-files {
        margin-top: 24px;
        
        h4 {
          margin: 0 0 16px 0;
          color: #333;
        }
      }

      .upload-progress {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-top: 16px;
        padding: 16px;
        background-color: #f5f5f5;
        border-radius: 4px;
      }
    }

    .actifs-updates {
      display: flex;
      flex-direction: column;
      gap: 24px;

      .actif-update-row {
        padding: 16px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background-color: #fafafa;

        .actif-info {
          margin-bottom: 16px;

          strong {
            display: block;
            color: #333;
            margin-bottom: 4px;
          }

          small {
            color: #666;
            margin-bottom: 8px;
            display: block;
          }
        }

        .actif-controls {
          display: flex;
          gap: 16px;
          align-items: flex-start;

          mat-form-field:first-child {
            min-width: 200px;
          }
        }
      }
    }

    .time-info {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .time-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;

        strong {
          color: #333;
        }

        span {
          color: #666;
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

    // Indice état classes
    .indice-1, .indice-2 {
      background-color: #ffebee !important;
      color: #d32f2f !important;
    }

    .indice-3 {
      background-color: #fff3e0 !important;
      color: #f57c00 !important;
    }

    .indice-4, .indice-5 {
      background-color: #e8f5e8 !important;
      color: #388e3c !important;
    }

    @media (max-width: 768px) {
      .dialog-content {
        min-width: auto;
        max-width: 95vw;
      }

      .actif-controls {
        flex-direction: column !important;
        
        mat-form-field:first-child {
          min-width: auto !important;
          width: 100%;
        }
      }
    }
  `]
})
export class ClotureInspectionDialogComponent implements OnInit {
  cloturerForm: FormGroup;
  selectedFiles: File[] = [];
  isDragOver = false;
  isSubmitting = false;
  isUploading = false;

  constructor(
    public dialogRef: MatDialogRef<ClotureInspectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { inspection: Inspection },
    private fb: FormBuilder,
    private inspectionsService: InspectionsService,
    private snackBar: MatSnackBar
  ) {
    this.cloturerForm = this.createForm();
  }

  get inspection(): Inspection {
    return this.data.inspection;
  }

  ngOnInit(): void {
    this.initializeActifsUpdates();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      commentaire: [''],
      actifsUpdates: this.fb.array([])
    });
  }

  private initializeActifsUpdates(): void {
    const actifsArray = this.cloturerForm.get('actifsUpdates') as FormArray;
    
    this.inspection.actifs?.forEach((actif, index) => {
      actifsArray.push(this.fb.group({
        actifId: [actif.id],
        nouvelIndiceEtat: [''],
        commentaire: ['']
      }));
    });
  }

  getActifUpdateFormGroup(index: number): FormGroup | null {
    const actifsArray = this.cloturerForm.get('actifsUpdates') as FormArray;
    return actifsArray.at(index) as FormGroup;
  }

  // File handling methods
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  private addFiles(files: File[]): void {
    const validFiles = files.filter(file => this.isValidFile(file));
    this.selectedFiles.push(...validFiles);

    if (validFiles.length !== files.length) {
      this.snackBar.open('Certains fichiers ont été ignorés (type non supporté)', 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-warning']
      });
    }
  }

  private isValidFile(file: File): boolean {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    return allowedTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB limit
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  // Submit form
  onSubmit(): void {
    if (this.cloturerForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    // Prepare the form data
    const formValue = this.cloturerForm.value;
    const cloturerDto: CloturerInspectionDto = {
      commentaire: formValue.commentaire || undefined,
      actifsUpdates: this.prepareActifsUpdates(formValue.actifsUpdates)
    };

    // First, close the inspection
    this.inspectionsService.cloturerInspection(this.inspection.id, cloturerDto)
      .pipe(
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: (updatedInspection) => {
          // If there are files, upload them
          if (this.selectedFiles.length > 0) {
            this.uploadFiles(updatedInspection);
          } else {
            this.dialogRef.close({ 
              success: true, 
              inspection: updatedInspection 
            });
          }
        },
        error: (error) => {
          this.snackBar.open(
            error.message || 'Erreur lors de la clôture', 
            'Fermer', 
            { duration: 5000, panelClass: ['snackbar-error'] }
          );
        }
      });
  }

  private uploadFiles(inspection: Inspection): void {
    this.isUploading = true;
    
    const fileList = this.createFileList(this.selectedFiles);
    
    this.inspectionsService.uploadLivrables(inspection.id, fileList)
      .pipe(
        finalize(() => this.isUploading = false)
      )
      .subscribe({
        next: () => {
          this.dialogRef.close({ 
            success: true, 
            inspection: inspection,
            filesUploaded: true 
          });
        },
        error: (error) => {
          // Even if upload fails, the inspection was closed successfully
          this.snackBar.open(
            'Inspection clôturée mais erreur lors de l\'upload des fichiers', 
            'Fermer',
            { duration: 5000, panelClass: ['snackbar-warning'] }
          );
          this.dialogRef.close({ 
            success: true, 
            inspection: inspection,
            uploadError: true 
          });
        }
      });
  }

  private createFileList(files: File[]): FileList {
    const dataTransfer = new DataTransfer();
    files.forEach(file => dataTransfer.items.add(file));
    return dataTransfer.files;
  }

  private prepareActifsUpdates(actifsUpdates: any[]): ActifConditionUpdateDto[] {
    return actifsUpdates
      .filter(update => update.nouvelIndiceEtat && update.nouvelIndiceEtat !== '')
      .map(update => ({
        actifId: update.actifId,
        nouvelIndiceEtat: parseInt(update.nouvelIndiceEtat),
        commentaire: update.commentaire || undefined
      }));
  }

  getCurrentDateTime(): string {
    return this.formatDateTime(new Date());
  }

  // Helper methods
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
      default: return 'attach_file';
    }
  }

  getIndiceEtatLabel(indice: number): string {
    switch (indice) {
      case 1: return 'Très mauvais';
      case 2: return 'Mauvais';
      case 3: return 'Moyen';
      case 4: return 'Bon';
      case 5: return 'Très bon';
      default: return 'Non défini';
    }
  }

  getIndiceEtatClass(indice: number): string {
    return `indice-${indice}`;
  }
}