import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Famille, Groupe, TypeInspection } from '../../../../../core/models/admin.interfaces';

export interface TypeInspectionDialogData {
  isEditMode: boolean;
  type?: TypeInspection;
  familles: Famille[];
  groupes: Groupe[];
  frequenceOptions: any[];
}

@Component({
  selector: 'app-type-inspection-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './type-inspection-dialog.component.html',
  styleUrls: ['./type-inspection-dialog.component.scss']
})
export class TypeInspectionDialogComponent implements OnInit {
  typeForm: FormGroup;
  isEditMode: boolean;

  // Make Number constructor available in template
Number = Number;

  constructor(
    
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<TypeInspectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TypeInspectionDialogData
  ) {
    this.isEditMode = data.isEditMode;
    this.typeForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      frequence: ['', Validators.required],
      idGroupe: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.type) {
      this.typeForm.patchValue(this.data.type);
    }
  }

  // Fixed type comparison - convert both to numbers
  getGroupesByFamille(idFamille: number): Groupe[] {
    return this.data.groupes.filter(g => Number(g.idFamille) === Number(idFamille));
  }

  onSave(): void {
    if (this.typeForm.valid) {
      this.dialogRef.close(this.typeForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}