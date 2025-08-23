import { Component, Inject, OnInit } from '@angular/core';
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
    MatChipsModule
  ],
  templateUrl: './inspection-dialog.component.html',
  styleUrls: ['./inspection-dialog.component.scss']
})
export class InspectionDialogComponent implements OnInit {
  inspectionForm!: FormGroup;
  isEditMode: boolean;
  typesInspection: TypeInspection[];
  allActifs: Actif[];
  groupes: Groupe[];
  filteredActifs: Actif[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<InspectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InspectionDialogData
  ) {
    this.isEditMode = !!data.inspection;
    this.typesInspection = data.typesInspection || [];
    this.allActifs = data.actifs || [];
    this.groupes = data.groupes || [];
    this.filteredActifs = [];
  }

  ngOnInit(): void {
  console.log('=== DIALOG DATA DEBUG ===');
  console.log('Groups:', this.groupes?.map(g => ({ id: g.id, nom: g.nom })));
  console.log('Actifs count:', this.allActifs?.length);
  console.log('Sample actifs:', this.allActifs?.slice(0, 5)?.map(a => ({ 
    id: a.id, nom: a.nom, idGroupe: a.idGroupe 
  })));
  
  this.initForm();
  this.listenToGroupChanges();
}

  private initForm(): void {
    this.inspectionForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      idType: ['', Validators.required],
      idGroupe: ['', Validators.required],
      dateDebut: [new Date(), Validators.required],
      dateFin: ['', Validators.required],
      actifIds: [[], [Validators.required, Validators.minLength(1)]],
      commentaire: ['']
    });

    if (this.isEditMode && this.data.inspection) {
      const inspection = this.data.inspection;
      const firstActif = this.allActifs.find(a => inspection.actifIds.includes(a.id));
      
      this.inspectionForm.patchValue({
        titre: inspection.titre,
        idType: inspection.idType,
        idGroupe: firstActif ? firstActif.idGroupe : '',
        dateDebut: new Date(inspection.dateDebut),
        dateFin: new Date(inspection.dateFin),
        actifIds: inspection.actifIds || [],
        commentaire: inspection.commentaire || ''
      });

      if (firstActif) {
        this.filterActifsByGroup(firstActif.idGroupe);
      }
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.inspectionForm.patchValue({ dateFin: tomorrow });
    }
  }

  private listenToGroupChanges(): void {
    this.inspectionForm.get('idGroupe')?.valueChanges.subscribe(groupId => {
      this.filterActifsByGroup(groupId);
      this.inspectionForm.get('actifIds')?.setValue([]);
    });
  }

  private filterActifsByGroup(groupId: string | null): void {
  console.log('=== DEBUGGING ASSET FILTERING ===');
  console.log('Selected group ID:', groupId);
  console.log('All actifs count:', this.allActifs?.length || 0);
  console.log('All actifs sample:', this.allActifs?.slice(0, 3));
  
  if (!this.allActifs) {
    console.warn('Assets not loaded yet');
    this.filteredActifs = [];
    return;
  }

  if (groupId) {
    console.log('Filtering actifs by group ID:', groupId);
    
    // Check what idGroupe values exist
    const uniqueGroupIds = [...new Set(this.allActifs.map(a => a.idGroupe))];
    console.log('Unique group IDs in actifs:', uniqueGroupIds);
    
    this.filteredActifs = this.allActifs.filter(actif => {
      const matches = actif && actif.idGroupe && actif.idGroupe.toString() === groupId.toString();
      if (matches) {
        console.log('Found matching actif:', actif.nom, 'with idGroupe:', actif.idGroupe);
      }
      return matches;
    });
    
    console.log(`Filtered ${this.filteredActifs.length} assets for group ${groupId}`);
    console.log('Filtered actifs:', this.filteredActifs.map(a => ({ nom: a.nom, idGroupe: a.idGroupe })));
  } else {
    this.filteredActifs = [];
  }
  
  console.log('=== END DEBUGGING ===');
}

  onActifToggle(actifId: string, checked: boolean): void {
    const currentActifIds = this.inspectionForm.get('actifIds')?.value || [];
    let newActifIds: string[];

    if (checked) {
      if (!currentActifIds.includes(actifId)) {
        newActifIds = [...currentActifIds, actifId];
      } else {
        newActifIds = currentActifIds;
      }
    } else {
      newActifIds = currentActifIds.filter((id: string) => id !== actifId);
    }
    
    this.inspectionForm.patchValue({ actifIds: newActifIds });
    this.inspectionForm.get('actifIds')?.markAsTouched();
    this.inspectionForm.get('actifIds')?.updateValueAndValidity();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.inspectionForm.valid) {
      const { idGroupe, ...formData } = this.inspectionForm.value;
      
      // Convert IDs to numbers and ensure proper date formatting
      const processedData = {
        ...formData,
        idType: parseInt(formData.idType),
        actifIds: formData.actifIds.map((id: string) => parseInt(id)),
        dateDebut: formData.dateDebut.toISOString(),
        dateFin: formData.dateFin.toISOString()
      };
      
      console.log('Sending inspection data:', processedData);
      this.dialogRef.close(processedData);
    } else {
      console.log('Form is invalid:', this.inspectionForm.errors);
      Object.keys(this.inspectionForm.controls).forEach(key => {
        const control = this.inspectionForm.get(key);
        if (control?.invalid) {
          console.log(`${key} errors:`, control.errors);
        }
      });
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