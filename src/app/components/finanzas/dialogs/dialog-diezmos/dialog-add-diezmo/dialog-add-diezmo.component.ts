import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FinanzasService, CrearDiezmoReq, DiezmoRow } from 'src/app/services/finanzas.service';

@Component({
  selector: 'app-dialog-add-diezmo',
  templateUrl: './dialog-add-diezmo.component.html',
  styleUrls: ['./dialog-add-diezmo.component.scss'],
})
export class DialogAddDiezmoComponent {
  /** Si viene data => es edición */
  isEdit = false;

  form = this.fb.group({
    tipo: ['Ingreso' as 'Ingreso' | 'Egreso', Validators.required],
    nombre: ['', Validators.required],
    cantidad: [null as number | null, [Validators.required, Validators.min(0.01)]],
    fecha: [new Date(), Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private fin: FinanzasService,
    private ref: MatDialogRef<DialogAddDiezmoComponent>,
    private snack: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: DiezmoRow | null
  ) {
    this.isEdit = !!data;

    if (data) {
      this.form.patchValue({
        tipo: data.tipo as 'Ingreso' | 'Egreso',
        nombre: data.nombre,
        cantidad: data.cantidad,
        fecha: new Date(data.fecha),
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const payload: CrearDiezmoReq = {
      tipo: v.tipo!,
      nombre: v.nombre!,
      cantidad: Number(v.cantidad),
      fecha: (v.fecha as Date).toISOString().slice(0, 10),
    };

    const req$ = this.isEdit
      ? this.fin.updateDiezmo(this.data!.id, payload)   // Observable<void>
      : this.fin.createDiezmo(payload);                 // Observable<{id:number}>

    // Firma compatible con tu RxJS: subscribe(undefined, error, complete)
    req$.subscribe(
      undefined, // onNext no lo usamos (tu firma lo quiere null/undefined)
      (e: any) => {
        console.error(e);
        this.snack.open('No se pudo guardar', 'OK', { duration: 2000 });
      },
      () => {
        this.snack.open(this.isEdit ? 'Actualizado' : 'Creado', 'OK', { duration: 1500 });
        this.ref.close(true);
      }
    );
  }

  cancel(): void {
    this.ref.close();
  }
}
