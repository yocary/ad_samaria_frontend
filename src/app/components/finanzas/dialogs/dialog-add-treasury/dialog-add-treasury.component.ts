import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { FinanzasService } from 'src/app/services/finanzas.service';
import { TreasuryStatus } from 'src/app/models/finanzas.model';

@Component({
  selector: 'app-dialog-add-treasury',
  templateUrl: './dialog-add-treasury.component.html',
  styleUrls: ['./dialog-add-treasury.component.scss']
})
export class DialogAddTreasuryComponent {
  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    status: ['Activo' as TreasuryStatus, Validators.required]
  });

  constructor(private fb: FormBuilder, private fin: FinanzasService, private ref: MatDialogRef<DialogAddTreasuryComponent>) {}

  save(){ if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { name, status } = this.form.value as { name: string; status: TreasuryStatus };
    this.fin.addTreasury(name, status);
    this.ref.close(true);
  }
  cancel(){ this.ref.close(); }
}
