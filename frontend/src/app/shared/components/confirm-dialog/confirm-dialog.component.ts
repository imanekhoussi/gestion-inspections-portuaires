// src/app/shared/components/confirm-dialog/confirm-dialog.component.ts

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header" [class]="'dialog-header-' + (data.type || 'warning')">
        <mat-icon class="dialog-icon">
          {{ data.icon || getDefaultIcon() }}
        </mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>

      <div mat-dialog-content class="dialog-content">
        <div class="message-container" [innerHTML]="formatMessage(data.message)"></div>
      </div>

      <div mat-dialog-actions class="dialog-actions">
        <button 
          mat-button 
          (click)="onCancel()"
          class="cancel-button"
        >
          {{ data.cancelText || 'Annuler' }}
        </button>
        
        <button 
          mat-raised-button 
          [color]="getButtonColor()"
          (click)="onConfirm()"
          class="confirm-button"
          cdkFocusInitial
        >
          {{ data.confirmText || 'Confirmer' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 400px;
      max-width: 600px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px 24px 16px 24px;
      margin-bottom: 8px;
      border-radius: 8px 8px 0 0;

      &.dialog-header-warning {
        background: linear-gradient(135deg, #fff3e0 0%, #ffecb3 100%);
        border-left: 4px solid #ff9800;
      }

      &.dialog-header-danger {
        background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
        border-left: 4px solid #f44336;
      }

      &.dialog-header-info {
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        border-left: 4px solid #2196f3;
      }

      .dialog-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        
        .dialog-header-warning & {
          color: #ff9800;
        }
        
        .dialog-header-danger & {
          color: #f44336;
        }
        
        .dialog-header-info & {
          color: #2196f3;
        }
      }

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
        color: #333;
      }
    }

    .dialog-content {
      padding: 0 24px 16px 24px;

      .message-container {
        line-height: 1.6;
        color: #666;
        font-size: 14px;
        
        // Support du HTML dans le message
        :deep(strong) {
          color: #333;
          font-weight: 600;
        }
        
        :deep(p) {
          margin: 8px 0;
        }
        
        :deep(ul) {
          margin: 8px 0;
          padding-left: 20px;
        }
        
        :deep(li) {
          margin: 4px 0;
        }
      }
    }

    .dialog-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding: 16px 24px 24px 24px;
      border-top: 1px solid #e0e0e0;

      .cancel-button {
        color: #666;
        
        &:hover {
          background: #f5f5f5;
        }
      }

      .confirm-button {
        min-width: 100px;
        
        &.mat-warn {
          background: #f44336;
          color: white;
          
          &:hover {
            background: #d32f2f;
          }
        }
        
        &.mat-primary {
          background: #2196f3;
          color: white;
          
          &:hover {
            background: #1976d2;
          }
        }
      }
    }

    // Responsive
    @media (max-width: 480px) {
      .confirm-dialog {
        min-width: 320px;
        max-width: 95vw;
      }
      
      .dialog-header {
        padding: 16px 16px 8px 16px;
        
        .dialog-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }
        
        h2 {
          font-size: 18px;
        }
      }
      
      .dialog-content {
        padding: 0 16px 12px 16px;
        
        .message-container {
          font-size: 13px;
        }
      }
      
      .dialog-actions {
        padding: 12px 16px 16px 16px;
        flex-direction: column-reverse;
        
        button {
          width: 100%;
          margin: 4px 0;
        }
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getDefaultIcon(): string {
    switch (this.data.type) {
      case 'danger':
        return 'warning';
      case 'info':
        return 'info';
      case 'warning':
      default:
        return 'help_outline';
    }
  }

  getButtonColor(): 'primary' | 'warn' {
    return this.data.type === 'danger' ? 'warn' : 'primary';
  }

  formatMessage(message: string): string {
    // Conversion simple des retours à la ligne en <br>
    // et support basique du markdown
    return message
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/⚠️/g, '<span style="color: #ff9800;">⚠️</span>')
      .replace(/❌/g, '<span style="color: #f44336;">❌</span>')
      .replace(/✅/g, '<span style="color: #4caf50;">✅</span>');
  }
}