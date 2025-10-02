import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FinanzasService } from 'src/app/services/finanzas.service';
import { Movement } from 'src/app/models/finanzas.model';

@Component({
  selector: 'app-dialog-movement',
  templateUrl: './dialog-movement.component.html',
  styleUrls: ['./dialog-movement.component.scss']
})
export class DialogMovementComponent {
  form = this.fb.group({
    type: ['Ingreso' as 'Ingreso' | 'Egreso', Validators.required],
    date: [new Date(), Validators.required],
    concept: ['', [Validators.required, Validators.maxLength(120)]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    method: ['Efectivo' as Movement['method'], Validators.required],
    memberName: [''],
    notes: [''],
    category: ['']
  });

  constructor(
    private fb: FormBuilder,
    private fin: FinanzasService,
    private ref: MatDialogRef<DialogMovementComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { treasuryId: number }
  ) {}

  save(){
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value;
    this.fin.addMovement({
      treasuryId: this.data.treasuryId,
      type: v.type!,
      date: (v.date as Date).toISOString(),
      concept: v.concept!,
      amount: v.amount!,
      method: v.method!,
      memberName: v.memberName || '',
      notes: v.notes || '',
      category: v.category || ''
    });
    this.ref.close(true);
  }
  cancel(){ this.ref.close(); }
}
