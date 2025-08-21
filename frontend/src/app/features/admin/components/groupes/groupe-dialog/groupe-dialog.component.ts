import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Famille, Groupe } from '../../../../../core/models/admin.interfaces';

export interface GroupeDialogData {
  isEditMode: boolean;
  groupe?: Groupe;
  familles: Famille[];
}

@Component({
  selector: 'app-groupe-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatTooltipModule
  ],
  templateUrl: './groupe-dialog.component.html',
  styleUrls: ['./groupe-dialog.component.scss']
})
export class GroupeDialogComponent implements OnInit {
  groupeForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<GroupeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GroupeDialogData
  ) {
    this.groupeForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10), Validators.pattern(/^[A-Z0-9_-]+$/)]],
      idFamille: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data.isEditMode && this.data.groupe) {
      this.groupeForm.patchValue(this.data.groupe);
    }
  }

  generateCode(): void {
    const nomControl = this.groupeForm.get('nom');
    const codeControl = this.groupeForm.get('code');

    if (nomControl?.value && !codeControl?.dirty) {
      const code = nomControl.value
        .toUpperCase()
        .replace(/[ÀÂÄÃÁÇ]/g, 'A').replace(/[ÈÊËÉ]/g, 'E')
        .replace(/[ÎÏÍÌ]/g, 'I').replace(/[ÔÖÓÒÕ]/g, 'O')
        .replace(/[ÛÜÚÙ]/g, 'U').replace(/[^A-Z0-9]/g, '_')
        .substring(0, 10);
      codeControl?.patchValue(code);
    }
  }

  onSave(): void {
    if (this.groupeForm.valid) {
      this.dialogRef.close(this.groupeForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}