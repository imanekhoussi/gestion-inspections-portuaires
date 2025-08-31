// src/app/features/log-historique/components/log-detail-dialog/log-detail-dialog.component.ts

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { LogHistorique } from '../../../../core/models/log-historique.interface';
import { LogHistoriqueService } from '../../services/log-historique.service';

@Component({
  selector: 'app-log-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatCardModule
  ],
  templateUrl: './log-detail-dialog.component.html',
  styleUrls: ['./log-detail-dialog.component.scss']
})
export class LogDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<LogDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LogHistorique,
    private logService: LogHistoriqueService
  ) {}

  formatDate(date: Date | string): string {
    return this.logService.formatDate(date);
  }

  getEtatBadgeClass(etat: string): string {
    return this.logService.getEtatBadgeClass(etat);
  }

  viewInspectionHistory(): void {
    if (this.data.inspection) {
      this.dialogRef.close({ action: 'viewInspection', inspectionId: this.data.inspection.id });
    }
  }

  viewUserActivity(): void {
    if (this.data.intervenant) {
      this.dialogRef.close({ action: 'viewUser', userId: this.data.intervenant.id });
    }
  }
}