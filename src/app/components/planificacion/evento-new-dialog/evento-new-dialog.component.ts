import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EventoNewPayload } from '../../planificacion/planificacion-eventos/tipos';

interface DialogData {
  liderazgoNombre?: string;
}

@Component({
  selector: 'app-evento-new-dialog',
  templateUrl: './evento-new-dialog.component.html',
  styleUrls: ['./evento-new-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class EventoNewDialogComponent {
  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(140)]],
    fecha:  [null as Date | null, Validators.required],
    descripcion: ['']
  });

  constructor(
    private fb: FormBuilder,
    private ref: MatDialogRef<EventoNewDialogComponent, EventoNewPayload | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  close() { this.ref.close(); }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value;
    const yyyy = (v.fecha as Date).getFullYear();
    const mm = String((v.fecha as Date).getMonth() + 1).padStart(2, '0');
    const dd = String((v.fecha as Date).getDate()).padStart(2, '0');

    const payload: EventoNewPayload = {
      nombre: v.nombre!.trim(),
      fecha: `${yyyy}-${mm}-${dd}`,
      descripcion: v.descripcion?.trim() || undefined
    };
    this.ref.close(payload);
  }
}
