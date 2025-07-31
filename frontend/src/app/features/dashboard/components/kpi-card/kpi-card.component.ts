import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <mat-card class="kpi-card" [ngClass]="colorClass">
      <mat-card-content>
        <div class="kpi-header">
          <mat-icon class="kpi-icon">{{ icon }}</mat-icon>
          <span class="kpi-value">{{ value | number:'1.1-1' }}{{ suffix }}</span>
        </div>
        <div class="kpi-title">{{ title }}</div>
        <div class="kpi-subtitle" *ngIf="subtitle">{{ subtitle }}</div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .kpi-card {
      height: 140px;
      display: flex;
      align-items: center;
      position: relative;
      overflow: hidden;
      transition: transform 0.2s ease-in-out;
      cursor: pointer;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      }

      &.primary {
        background: linear-gradient(135deg, #1976d2, #1565c0);
        color: white;
      }

      &.success {
        background: linear-gradient(135deg, #388e3c, #2e7d32);
        color: white;
      }

      &.warning {
        background: linear-gradient(135deg, #f57c00, #ef6c00);
        color: white;
      }

      &.accent {
        background: linear-gradient(135deg, #7b1fa2, #6a1b9a);
        color: white;
      }
    }

    .kpi-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 8px;
    }

    .kpi-icon {
      font-size: 32px;
      height: 32px;
      width: 32px;
      opacity: 0.9;
    }

    .kpi-value {
      font-size: 2.2rem;
      font-weight: 600;
      line-height: 1;
    }

    .kpi-title {
      font-size: 1rem;
      font-weight: 500;
      opacity: 0.95;
      margin-bottom: 4px;
    }

    .kpi-subtitle {
      font-size: 0.875rem;
      opacity: 0.8;
    }
  `]
})
export class KpiCardComponent {
  @Input() title!: string;
  @Input() subtitle?: string;
  @Input() value!: number;
  @Input() suffix: string = '';
  @Input() icon!: string;
  @Input() colorClass!: string;
}