// src/app/features/admin/components/inspections/inspection-dialog/inspection-dialog.component.ts

import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Actif, Inspection, TypeInspection, Utilisateur } from '../../../../../core/models/admin.interfaces';
import { CommonModule } from '@angular/common';

// Import necessary Angular Material modules
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';


// This interface defines the data that will be passed TO the dialog
export interface InspectionDialogData {
  isEditMode: boolean;
  inspection?: Inspection;
  typesInspection: TypeInspection[];
  actifs: Actif[];
  inspecteurs: Utilisateur[];
}

@Component({
  selector: 'app-inspection-dialog',
  standalone: true, // Set component to standalone
  imports: [
    // Add all required modules here
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './inspection-dialog.component.html',
  styleUrls: ['./inspection-dialog.component.scss']
})
export class InspectionDialogComponent implements OnInit {
  inspectionForm: FormGroup;
  isEditMode: boolean;

  // Make the passed-in data available to the template
  typesInspection: TypeInspection[] = [];
  actifs: Actif[] = [];
  inspecteurs: Utilisateur[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<InspectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InspectionDialogData
  ) {
    this.isEditMode = data.isEditMode;
    this.typesInspection = data.typesInspection;
    this.actifs = data.actifs;
    this.inspecteurs = data.inspecteurs;

    this.inspectionForm = this.fb.group({
      // Keep all form controls here
      titre: ['', [Validators.required, Validators.minLength(3)]],
      idType: ['', Validators.required],
      dateDebut: [new Date(), Validators.required],
      dateFin: [new Date(), Validators.required],
      idInspecteur: [''],
      actifIds: [[], [Validators.required, Validators.minLength(1)]],
      commentaire: ['']
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.inspection) {
      // If editing, patch the form with existing data
      const inspection = this.data.inspection;
      this.inspectionForm.patchValue({
        titre: inspection.titre,
        idType: inspection.typeInspection?.id,
        dateDebut: new Date(inspection.dateDebut),
        dateFin: new Date(inspection.dateFin),
        idInspecteur: inspection.createur?.id || '',
        actifIds: inspection.actifs?.map(a => a.id) || [],
        commentaire: inspection.commentaire || ''
      });
    }
  }

  onCancel(): void {
    // Close the dialog without sending back any data
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.inspectionForm.invalid) {
      return; // Don't submit if the form is invalid
    }
    // Close the dialog and pass the form data back to the parent component
    this.dialogRef.close(this.inspectionForm.value);
  }

  // You can move helper methods like onActifToggle here as well
  onActifToggle(actifId: string, checked: boolean): void {
    const currentActifIds = this.inspectionForm.get('actifIds')?.value || [];
    const newActifIds = checked
        ? [...currentActifIds, actifId]
        : currentActifIds.filter((id: string) => id !== actifId);
    
    this.inspectionForm.patchValue({ actifIds: newActifIds });
    this.inspectionForm.get('actifIds')?.markAsTouched();
  }
}