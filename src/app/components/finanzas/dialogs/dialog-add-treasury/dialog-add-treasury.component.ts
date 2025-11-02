import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FinanzasService } from 'src/app/services/finanzas.service';
import { TesoreriaCreate } from 'src/app/models/finanzas.model';

@Component({
  selector: 'app-dialog-add-treasury',
  templateUrl: './dialog-add-treasury.component.html',
  styleUrls: ['./dialog-add-treasury.component.scss'],
      encapsulation: ViewEncapsulation.None,
})
export class DialogAddTreasuryComponent {
  saving = false;

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    estado: [true, Validators.required], // true=Activo, false=Inactivo
  });

  constructor(
    private fb: FormBuilder,
    private api: FinanzasService,
    private snack: MatSnackBar,
    private ref: MatDialogRef<DialogAddTreasuryComponent>
  ) {}

  guardar() {
    if (this.form.invalid || this.saving) return;
    this.saving = true;

    const payload: TesoreriaCreate = this.form.value as TesoreriaCreate;

    this.api.crearTesoreria(payload).subscribe({
      next: (res) => {
        this.snack.open(res?.mensaje || 'Tesorería creada con éxito', 'OK', { duration: 2500 });
        this.ref.close(true); // avisa al padre para refrescar
      },
      error: (err) => {
        const status = err?.status;
        const msg =
          status === 409
            ? 'Ya existe una tesorería con ese nombre'
            : (err?.error?.message || 'No se pudo crear la tesorería');
        this.snack.open(msg, 'Cerrar', { duration: 3500 });
        this.saving = false;
      }
    });
  }
}
