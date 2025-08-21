// inspection-details-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { CalendarEventData } from '../../services/inspections.service';

@Component({
  selector: 'app-inspection-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule
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
      <div class="inspection-details">
        <div class="detail-row">
          <strong>Titre:</strong>
          <span>{{ data.title }}</span>
        </div>

        <div class="detail-row">
          <strong>Statut:</strong>
          <mat-chip-set>
            <mat-chip [ngClass]="getStatusClass(data.status)">
              {{ data.status }}
            </mat-chip>
          </mat-chip-set>
        </div>

        <div class="detail-row">
          <strong>Date de début:</strong>
          <span>{{ formatDate(data.start) }}</span>
        </div>

        <div class="detail-row" *ngIf="data.end">
          <strong>Date de fin:</strong>
          <span>{{ formatDate(data.end) }}</span>
        </div>

        <div class="detail-row" *ngIf="getInspecteur()">
          <strong>Inspecteur:</strong>
          <span>{{ getInspecteur() }}</span>
        </div>

        <div class="detail-row" *ngIf="getActif()">
          <strong>Actif:</strong>
          <span>{{ getActif() }}</span>
        </div>

        <div class="detail-row" *ngIf="getPriorite()">
          <strong>Priorité:</strong>
          <mat-chip-set>
            <mat-chip [ngClass]="getPriorityClass(getPriorite()!)">
              {{ getPriorite()! }}
            </mat-chip>
          </mat-chip-set>
        </div>

        <div class="detail-row" *ngIf="getDescription()">
          <strong>Description:</strong>
          <p class="description">{{ getDescription() }}</p>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-button mat-dialog-close>Fermer</button>
      <button mat-raised-button color="primary" (click)="viewFullDetails()">
        <mat-icon>visibility</mat-icon>
        Voir tous les détails
      </button>
      <button mat-raised-button color="accent" (click)="editInspection()">
        <mat-icon>edit</mat-icon>
        Modifier
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
      min-width: 500px;
      max-width: 600px;
    }

    .inspection-details {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .detail-row {
      display: flex;
      flex-direction: column;
      gap: 4px;

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

      .description {
        margin: 8px 0 0 0;
        padding: 12px;
        background-color: #f5f5f5;
        border-radius: 4px;
        border-left: 4px solid #1976d2;
        line-height: 1.6;
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 24px;
      padding: 16px 0 0 0;
      border-top: 1px solid #e0e0e0;

      button {
        mat-icon {
          margin-right: 8px;
        }
      }
    }

    // Status chip styles
    .status-scheduled {
      background-color: #e3f2fd !important;
      color: #1976d2 !important;
    }

    .status-completed {
      background-color: #e8f5e8 !important;
      color: #388e3c !important;
    }

    .status-cancelled {
      background-color: #ffebee !important;
      color: #d32f2f !important;
    }

    .status-rejected {
      background-color: #ffebee !important;
      color: #d32f2f !important;
    }

    // Priority chip styles
    .priority-low {
      background-color: #e8f5e8 !important;
      color: #4caf50 !important;
    }

    .priority-normal {
      background-color: #e3f2fd !important;
      color: #2196f3 !important;
    }

    .priority-high {
      background-color: #fff3e0 !important;
      color: #ff9800 !important;
    }

    .priority-critical {
      background-color: #ffebee !important;
      color: #f44336 !important;
    }

    @media (max-width: 600px) {
      .dialog-content {
        min-width: auto;
        width: 100%;
      }

      .dialog-actions {
        flex-direction: column;

        button {
          width: 100%;
        }
      }
    }
  `]
})
export class InspectionDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<InspectionDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CalendarEventData
  ) {}

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Helper methods to safely access properties that might not exist in CalendarEventData
  getInspecteur(): string | null {
    return (this.data as any).inspecteur || (this.data as any).inspecteurNom || null;
  }

  getActif(): string | null {
    return (this.data as any).actif || (this.data as any).actifNom || null;
  }

  getPriorite(): string | null {
    return (this.data as any).priorite || null;
  }

  getDescription(): string | null {
    return (this.data as any).description || null;
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'planifiée':
        return 'status-scheduled';
      case 'terminée':
        return 'status-completed';
      case 'annulée':
        return 'status-cancelled';
      case 'rejetée':
        return 'status-rejected';
      default:
        return '';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'basse':
        return 'priority-low';
      case 'normale':
        return 'priority-normal';
      case 'haute':
        return 'priority-high';
      case 'critique':
        return 'priority-critical';
      default:
        return 'priority-normal';
    }
  }

  viewFullDetails(): void {
    // Navigate to full inspection details page
    // You could emit an event or use a service to handle this
    this.dialogRef.close({ action: 'view', inspectionId: this.data.id });
  }

  editInspection(): void {
    // Navigate to edit inspection page
    this.dialogRef.close({ action: 'edit', inspectionId: this.data.id });
  }
}