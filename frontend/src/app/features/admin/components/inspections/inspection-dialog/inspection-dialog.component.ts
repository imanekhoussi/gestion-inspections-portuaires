// src/app/features/admin/components/inspections/inspection-dialog/inspection-dialog.component.ts
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { Inspection, TypeInspection, Actif, Groupe } from '../../../../../core/models/admin.interfaces';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface InspectionDialogData {
  inspection?: Inspection;
  typesInspection: TypeInspection[];
  actifs: Actif[];
  groupes: Groupe[];
}

@Component({
  selector: 'app-inspection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTableModule // <-- Added for mat-table
  ],
  templateUrl: './inspection-dialog.component.html',
  styleUrls: ['./inspection-dialog.component.scss']
})
export class InspectionDialogComponent implements OnInit, OnDestroy {
  inspectionForm!: FormGroup;
  isEditMode: boolean;
  typesInspection: TypeInspection[];
  allActifs: Actif[];
  groupes: Groupe[];

  // Properties for the asset selection table
  displayedColumns: string[] = ['select', 'nom', 'code', 'site'];
  dataSource = new MatTableDataSource<Actif>();
  selection = new SelectionModel<Actif>(true, []); // `true` for multi-select

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<InspectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InspectionDialogData
  ) {
    this.isEditMode = !!data.inspection;
    this.typesInspection = data.typesInspection || [];
    this.allActifs = data.actifs || [];
    this.groupes = data.groupes || [];
  }

  ngOnInit(): void {
    this.initForm();
    this.listenToGroupChanges();
    this.listenToSelectionChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.inspectionForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      idType: ['', Validators.required],
      idGroupe: [null, Validators.required],
      dateDebut: [new Date(), Validators.required],
      dateFin: ['', Validators.required],
      actifIds: [[], [Validators.required, Validators.minLength(1)]],
      commentaire: ['']
    });

    if (this.isEditMode && this.data.inspection) {
      const inspection = this.data.inspection;
      const firstActif = this.allActifs.find(a => inspection.actifIds.includes(a.id));
      const initialGroupId = firstActif ? firstActif.idGroupe : null;

      this.inspectionForm.patchValue({
        titre: inspection.titre,
        idType: inspection.idType,
        idGroupe: initialGroupId,
        dateDebut: new Date(inspection.dateDebut),
        dateFin: new Date(inspection.dateFin),
        actifIds: inspection.actifIds || [],
        commentaire: inspection.commentaire || ''
      });

      if (initialGroupId) {
        const filtered = this.allActifs.filter(actif => actif?.idGroupe?.toString() === initialGroupId.toString());
        this.dataSource.data = filtered;

        const initialSelectedActifs = this.dataSource.data.filter(actif =>
          inspection.actifIds.includes(actif.id)
        );
        this.selection.select(...initialSelectedActifs);
      }
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.inspectionForm.patchValue({ dateFin: tomorrow });
    }
  }

  private listenToGroupChanges(): void {
    this.inspectionForm.get('idGroupe')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(groupId => {
        let filteredActifs: Actif[] = [];
        if (groupId) {
          filteredActifs = this.allActifs.filter(actif => actif?.idGroupe?.toString() === groupId.toString());
        }
        this.dataSource.data = filteredActifs;
        this.selection.clear(); // Clear previous selection when group changes
      });
  }

  private listenToSelectionChanges(): void {
    this.selection.changed
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const ids = this.selection.selected.map(s => s.id);
        this.inspectionForm.get('actifIds')?.setValue(ids);
        this.inspectionForm.get('actifIds')?.markAsTouched();
      });
  }
  
  /** Checks if all displayed assets are selected. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.inspectionForm.valid) {
      const { idGroupe, ...formData } = this.inspectionForm.value;
      
      const processedData = {
        ...formData,
        idType: parseInt(formData.idType),
        actifIds: formData.actifIds.map((id: string) => parseInt(id)),
        dateDebut: formData.dateDebut.toISOString(),
        dateFin: formData.dateFin.toISOString()
      };
      
      this.dialogRef.close(processedData);
    } else {
      this.inspectionForm.markAllAsTouched();
    }
  }

  getErrorMessage(field: string): string {
    const control = this.inspectionForm.get(field);
    if (control?.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (control?.hasError('minlength')) {
      const requiredLength = control.errors?.['minlength']?.requiredLength;
      return `Minimum ${requiredLength} caractères requis`;
    }
    return '';
  }
}