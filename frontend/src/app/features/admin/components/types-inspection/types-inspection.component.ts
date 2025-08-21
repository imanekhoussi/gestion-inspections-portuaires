import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';

import { TypeInspectionDialogComponent } from './type-inspection-dialog/type-inspection-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component'; // Mettez le bon chemin
import { Famille, Groupe, TypeInspection } from '../../../../core/models/admin.interfaces';
import { AdminService } from '../../services/admin.service'; // Mettez le bon chemin

@Component({
  selector: 'app-types-inspection',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './types-inspection.component.html',
  styleUrls: ['./types-inspection.component.scss']
})
export class TypesInspectionComponent implements OnInit {
  displayedColumns: string[] = ['nom', 'frequence', 'groupe', 'famille', 'actions'];
  
  isLoading = true;
  typesInspection: TypeInspection[] = [];
  familles: Famille[] = [];
  groupes: Groupe[] = [];
  
  frequenceOptions = [
    { value: 'Quotidienne', label: 'Quotidienne' },
    { value: 'Hebdomadaire', label: 'Hebdomadaire' },
    { value: 'Mensuelle', label: 'Mensuelle' },
    { value: 'Trimestrielle', label: 'Trimestrielle' },
    { value: 'Semestrielle', label: 'Semestrielle' },
    { value: 'Annuelle', label: 'Annuelle' }
  ];

  constructor(
    private dialog: MatDialog,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      types: this.adminService.getTypesInspection(),
      groupes: this.adminService.getGroupes(),
      familles: this.adminService.getFamilles()
    }).subscribe({
      next: (data) => {
        this.typesInspection = data.types;
        this.groupes = data.groupes;
        this.familles = data.familles;
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Échec du chargement des données", err);
        this.isLoading = false;
      }
    });
  }

  openDialog(type?: TypeInspection): void {
    const dialogRef = this.dialog.open(TypeInspectionDialogComponent, {
      width: '500px',
      data: {
        isEditMode: !!type,
        type: type ? {...type} : undefined,
        familles: this.familles,
        groupes: this.groupes,
        frequenceOptions: this.frequenceOptions
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (type && type.id) {
          this.updateType(Number(type.id), result);
        } else {
          this.createType(result);
        }
      }
    });
  }

  createType(typeData: any): void {
    this.adminService.createTypeInspection(typeData).subscribe(() => {
      this.loadData();
    });
  }

  updateType(id: number, typeData: any): void {
    this.adminService.updateTypeInspection(id, typeData).subscribe(() => {
      this.loadData();
    });
  }

  confirmAndDeleteType(type: TypeInspection): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Confirmation de suppression',
        message: `Êtes-vous sûr de vouloir supprimer le type d'inspection <strong>${type.nom}</strong> ? <br><br>Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.deleteTypeInspection(Number(type.id)).subscribe(() => {
          this.loadData();
        });
      }
    });
  }
  
  getFrequenceLabel(value: string): string {
    return this.frequenceOptions.find(f => f.value === value)?.label || value;
  }
}