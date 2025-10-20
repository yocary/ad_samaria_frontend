import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-grupo-dialog',
  templateUrl: './create-grupo-dialog.component.html',
  styleUrls: ['./create-grupo-dialog.component.scss']
})
export class CreateGrupoDialogComponent {
  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    estado: [true, Validators.required],
    tesoreria: [true, Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private ref: MatDialogRef<CreateGrupoDialogComponent>
  ) {}

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = this.form.value;
    console.log('Grupo creado:', data);
    Swal.fire('Éxito', 'El grupo fue creado correctamente.', 'success');
    this.ref.close(true);
  }

  cancelar() {
    this.ref.close(false);
  }
}
