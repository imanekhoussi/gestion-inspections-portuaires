import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { TypeInspectionDialogComponent } from './type-inspection-dialog/type-inspection-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Famille, Groupe, TypeInspection } from '../../../../core/models/admin.interfaces';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-types-inspection',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatCardModule,
    MatPaginatorModule,
    MatSortModule
  ],
  templateUrl: './types-inspection.component.html',
  styleUrls: ['./types-inspection.component.scss']
})
export class TypesInspectionComponent implements OnInit, OnDestroy, AfterViewInit {
  displayedColumns: string[] = ['nom', 'frequence', 'groupe', 'famille', 'actions'];
  dataSource = new MatTableDataSource<TypeInspection>();

  isLoading = true;
  
  // Data stores
  private allTypesInspection: TypeInspection[] = [];
  familles: Famille[] = [];
  groupes: Groupe[] = [];
  
  // Filter controls
  searchControl = new FormControl('');
  selectedFamille: string | null = null;
  selectedGroupe: string | null = null;
  selectedFrequence: string | null = null;
  
  private searchSubscription!: Subscription;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  frequenceOptions = [
    { value: 'Quotidienne', label: 'Journalière' },
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
    this.searchSubscription = this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => this.applyFilters());
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      types: this.adminService.getTypesInspection(),
      groupes: this.adminService.getGroupes(),
      familles: this.adminService.getFamilles()
    }).subscribe({
      next: (data) => {
        this.allTypesInspection = data.types;
        this.dataSource.data = data.types;
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

  applyFilters(): void {
    let filteredData = [...this.allTypesInspection];
    const searchTerm = this.searchControl.value?.toLowerCase() || '';

    if (searchTerm) {
      filteredData = filteredData.filter(type =>
        type.nom.toLowerCase().includes(searchTerm) ||
        this.getFrequenceLabel(type.frequence).toLowerCase().includes(searchTerm) ||
        (type.groupe && type.groupe.nom.toLowerCase().includes(searchTerm)) ||
        (type.groupe?.famille && type.groupe.famille.nom.toLowerCase().includes(searchTerm))
      );
    }

    if (this.selectedFamille) {
      filteredData = filteredData.filter(type => type.groupe?.famille?.id === this.selectedFamille);
    }

    if (this.selectedGroupe) {
      filteredData = filteredData.filter(type => type.groupe?.id === this.selectedGroupe);
    }
    
    if (this.selectedFrequence) {
      filteredData = filteredData.filter(type => type.frequence === this.selectedFrequence);
    }

    this.dataSource.data = filteredData;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  removeFilter(filterName: 'search' | 'famille' | 'groupe' | 'frequence'): void {
    switch (filterName) {
      case 'search':
        this.searchControl.setValue('', { emitEvent: false });
        break;
      case 'famille':
        this.selectedFamille = null;
        break;
      case 'groupe':
        this.selectedGroupe = null;
        break;
      case 'frequence':
        this.selectedFrequence = null;
        break;
    }
    this.applyFilters();
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
    this.adminService.createTypeInspection(typeData).subscribe(() => this.loadData());
  }

  updateType(id: number, typeData: any): void {
    this.adminService.updateTypeInspection(id, typeData).subscribe(() => this.loadData());
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
        this.adminService.deleteTypeInspection(Number(type.id)).subscribe(() => this.loadData());
      }
    });
  }

  getFrequenceLabel(value: string): string {
    return this.frequenceOptions.find(f => f.value === value)?.label || value;
  }
  
  getFamilleName(id: string): string {
    return this.familles.find(f => f.id === id)?.nom || '';
  }

  getGroupeName(id: string): string {
    return this.groupes.find(g => g.id === id)?.nom || '';
  }
}