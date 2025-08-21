import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Famille } from '../../../../../core/models/admin.interfaces';

export interface FamilleDialogData {
  isEditMode: boolean;
  famille?: Famille;
}

@Component({
  selector: 'app-famille-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatTooltipModule
  ],
  templateUrl: './famille-dialog.component.html',
  styleUrls: ['./famille-dialog.component.scss']
})
export class FamilleDialogComponent implements OnInit {
  familleForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FamilleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FamilleDialogData
  ) {
    this.familleForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10), Validators.pattern(/^[A-Z0-9_-]+$/)]]
    });
  }

  ngOnInit(): void {
    if (this.data.isEditMode && this.data.famille) {
      this.familleForm.patchValue(this.data.famille);
    }
  }

  generateCode(): void {
    const nomControl = this.familleForm.get('nom');
    const codeControl = this.familleForm.get('code');

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
    if (this.familleForm.valid) {
      this.dialogRef.close(this.familleForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}