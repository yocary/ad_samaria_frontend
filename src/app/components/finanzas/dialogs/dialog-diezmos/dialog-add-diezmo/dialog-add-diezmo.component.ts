import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FinanzasService, CrearDiezmoReq, DiezmoRow } from 'src/app/services/finanzas.service';
import { MiembrosService } from 'src/app/services/miembros.service';
import { Observable, of } from 'rxjs';
import { startWith, debounceTime, map, distinctUntilChanged, switchMap } from 'rxjs/operators';

interface PersonaMini { id: number; nombre: string; }

@Component({
  selector: 'app-dialog-add-diezmo',
  templateUrl: './dialog-add-diezmo.component.html',
  styleUrls: ['./dialog-add-diezmo.component.scss'],
})
export class DialogAddDiezmoComponent implements OnInit {
  /** Si viene data => es edición */
  isEdit = false;

  form = this.fb.group({
    tipo: ['Ingreso' as 'Ingreso' | 'Egreso', Validators.required],
    personaId: [null as number | null, Validators.required],
    cantidad: [null as number | null, [Validators.required, Validators.min(0.01)]],
    fecha: [new Date(), Validators.required],
  });

  // Autocomplete personas
  personaQuery = new FormControl('');
  personas$!: Observable<PersonaMini[]>;
  personaSeleccionada: PersonaMini | null = null;

  constructor(
    private fb: FormBuilder,
    private fin: FinanzasService,
    private ref: MatDialogRef<DialogAddDiezmoComponent>,
    private snack: MatSnackBar,
    private miembrosSvc: MiembrosService,
    @Inject(MAT_DIALOG_DATA) public data: DiezmoRow | null
  ) {
    this.isEdit = !!data;

    if (data) {
      // precarga para edición
      this.form.patchValue({
        tipo: data.tipo,
        personaId: data.personaId,
        cantidad: data.cantidad,
        fecha: new Date(data.fecha),
      });
      // muestra el nombre en el input de búsqueda
      this.personaSeleccionada = { id: data.personaId, nombre: data.nombre };
      this.personaQuery.setValue(data.nombre);
    }
  }

  ngOnInit(): void {
    // stream para buscar personas
    this.personas$ = this.personaQuery.valueChanges.pipe(
      startWith(this.personaQuery.value || ''),
      debounceTime(250),
      map(v => (v || '').toString().trim()),
      distinctUntilChanged(),
      switchMap((q: string) => q.length < 2
        ? of<PersonaMini[]>([])
        : this.miembrosSvc.buscarMin$(q) // ← Debe devolver { id, nombre }
      )
    );
  }

  displayPersona = (p?: PersonaMini) => (p ? p.nombre : '');

  seleccionarPersona(p: PersonaMini) {
    this.personaSeleccionada = p;
    this.personaQuery.setValue(p.nombre, { emitEvent: false });
    this.form.get('personaId')?.setValue(p.id);
  }

  limpiarPersona() {
    this.personaSeleccionada = null;
    this.personaQuery.setValue('');
    this.form.get('personaId')?.reset();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const payload: CrearDiezmoReq = {
      tipo: v.tipo!,
      personaId: v.personaId!,                 // 👈 ahora enviamos personaId
      cantidad: Number(v.cantidad),
      fecha: (v.fecha as Date).toISOString().slice(0, 10),
    };

    const req$ = this.isEdit
      ? this.fin.updateDiezmo(this.data!.id, payload)   // Observable<void>
      : this.fin.createDiezmo(payload);                 // Observable<{id:number}>

    req$.subscribe(
      undefined,
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
