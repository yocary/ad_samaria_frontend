import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FinanzasService, CrearMovimientoReq, CategoriaMini } from 'src/app/services/finanzas.service';
import { Movement } from 'src/app/models/finanzas.model';
import { Observable, of } from 'rxjs';
import { startWith, debounceTime, map, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { MiembrosService } from 'src/app/services/miembros.service';

interface PersonaMini { id: number; nombre: string; }

@Component({
  selector: 'app-dialog-movement',
  templateUrl: './dialog-movement.component.html',
  styleUrls: ['./dialog-movement.component.scss']
})
export class DialogMovementComponent implements OnInit {

  form = this.fb.group({
    type: ['Ingreso' as 'Ingreso' | 'Egreso', Validators.required],
    date: [new Date(), Validators.required],
    // concept -> ahora será categoriaId
    categoriaId: [null as number | null, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    method: ['Efectivo' as Movement['method'], Validators.required],
    personaId: [null],
    notes: ['']
  });

  // Personas
  personaQuery = new FormControl('');
  personas$!: Observable<PersonaMini[]>;
  personaSeleccionada: PersonaMini | null = null;

  // Categorías
  categorias: CategoriaMini[] = [];

  constructor(
    private fb: FormBuilder,
    private fin: FinanzasService,
    private ref: MatDialogRef<DialogMovementComponent>,
    private miembrosSvc: MiembrosService,
    @Inject(MAT_DIALOG_DATA) public data: { treasuryId: number }
  ) {}

  ngOnInit(): void {
    // Cargar categorías iniciales según el tipo default
    this.loadCategorias(this.form.get('type')!.value as 'Ingreso'|'Egreso');

    // Si cambia el tipo, recargar categorías y limpiar selección
    this.form.get('type')!.valueChanges.subscribe(t => {
      const tipo = (t as 'Ingreso'|'Egreso') || 'Ingreso';
      this.loadCategorias(tipo);
      this.form.get('categoriaId')!.reset(null);
    });

    // Autocomplete Personas
    this.personas$ = this.personaQuery.valueChanges.pipe(
      startWith(''),
      debounceTime(250),
      map(v => (v || '').toString().trim()),
      distinctUntilChanged(),
      switchMap((q: string) => q.length < 2 ? of([]) : this.miembrosSvc.buscarMin$(q))
    );
  }

  private loadCategorias(tipo: 'Ingreso'|'Egreso') {
    this.fin.getCategoriasPorTipo(tipo).subscribe(list => this.categorias = list || []);
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

  private metodoPagoIdFromName(name: Movement['method']): number {
    // AJUSTA a tu catálogo real
    const map: Record<string, number> = { Efectivo: 1, Transferencia: 2, Tarjeta: 3, Otro: 4 };
    return map[name] ?? 1;
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;
    const payload: CrearMovimientoReq = {
      tipo: v.type!,
      fecha: (v.date as Date).toISOString().slice(0, 10),
      concepto: '', // el “concepto” visible es la categoría; el detalle libre podrías meterlo en notas
      cantidad: Number(v.amount),
      metodoPagoId: this.metodoPagoIdFromName(v.method!),
      personaId: (v.personaId as number) || undefined,
      categoriaId: (v.categoriaId as number) || undefined,
      observaciones: v.notes || ''
    };

    this.fin.addMovements(this.data.treasuryId, payload).subscribe({
      next: () => this.ref.close(true),
      error: (err: any) => console.error(err)
    });
  }

  cancel(){ this.ref.close(); }
}
