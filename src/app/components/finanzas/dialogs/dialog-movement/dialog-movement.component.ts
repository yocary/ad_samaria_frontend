// src/app/components/.../dialog-movement/dialog-movement.component.ts

import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  FinanzasService,
  CrearMovimientoReq,
  CategoriaMini,
  MetodoPago,
} from 'src/app/services/finanzas.service';
import { Movement } from 'src/app/models/finanzas.model';
import { Observable, of } from 'rxjs';
import {
  startWith,
  debounceTime,
  map,
  distinctUntilChanged,
  switchMap,
  take,
} from 'rxjs/operators';
import { MiembrosService } from 'src/app/services/miembros.service';

interface PersonaMini {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-dialog-movement',
  templateUrl: './dialog-movement.component.html',
  styleUrls: ['./dialog-movement.component.scss'],
})
export class DialogMovementComponent implements OnInit {
  // 🔁 Alta/Edición
  isEdit = false;

  form = this.fb.group({
    type: ['Ingreso' as 'Ingreso' | 'Egreso', Validators.required],
    date: [new Date(), Validators.required],
    categoriaId: [null as number | null, Validators.required],
    amount: [
      null as number | null,
      [Validators.required, Validators.min(0.01)],
    ],
    // 👇 ahora trabajamos con el ID (requerido)
    metodoPagoId: [null as number | null, Validators.required],
    // persona requerida
    personaId: [null, Validators.required],
    notes: [''],
  });

  // Personas (autocomplete)
  personaQuery = new FormControl('');
  personas$!: Observable<PersonaMini[]>;
  personaSeleccionada: PersonaMini | null = null;

  // Catálogos
  categorias: CategoriaMini[] = [];
  metodosPago: MetodoPago[] = [];

  constructor(
    private fb: FormBuilder,
    private fin: FinanzasService,
    private ref: MatDialogRef<DialogMovementComponent>,
    private miembrosSvc: MiembrosService,
    @Inject(MAT_DIALOG_DATA)
    public data: { treasuryId: number; movement?: Movement }
  ) {}

  // ===== Helpers de fecha (evitar off-by-one por TZ) =====
  private parseLocalYmd(s: string): Date {
    // s esperado: 'YYYY-MM-DD'
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, (m - 1), d);
  }

  private normalizeToLocalMidnight(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private formatLocalYmd(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  ngOnInit(): void {
    this.isEdit = !!this.data?.movement;

    // 1) Cargar métodos de pago primero (porque al editar quizá necesitemos resolver el ID por nombre)
    this.loadMetodosPago(() => {
      // 2) Cargar categorías según tipo inicial o del movimiento
      const tipoInicial =
        (this.data.movement?.type as 'Ingreso' | 'Egreso') ||
        (this.form.get('type')!.value as 'Ingreso' | 'Egreso') ||
        'Ingreso';

      // Si es edición, setear tipo primero (sin disparar valueChanges)
      if (this.isEdit && this.data.movement?.type) {
        this.form
          .get('type')!
          .setValue(this.data.movement.type as 'Ingreso' | 'Egreso', {
            emitEvent: false,
          });
      }

      this.loadCategorias(tipoInicial, () => {
        // 3) Si es edición, prellenar todo
        if (this.isEdit && this.data.movement) {
          const mv = this.data.movement;

          // ===== Fecha sin desfase =====
          let fecha: Date;
          if (mv.date) {
            if (typeof mv.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(mv.date)) {
              // Llega 'YYYY-MM-DD' → parseo local
              fecha = this.parseLocalYmd(mv.date);
            } else {
              // Llega Date o ISO con hora → normalizo a medianoche local
              const tmp = new Date(mv.date as any);
              fecha = this.normalizeToLocalMidnight(tmp);
            }
          } else {
            const today = new Date();
            fecha = this.normalizeToLocalMidnight(today);
          }

          this.form.patchValue(
            {
              date: fecha,
              amount: mv.amount,
              notes: mv.notes || '',
            },
            { emitEvent: false }
          );

          // Categoría: buscar por nombre recibido desde backend
          const cat = this.categorias.find(
            (c) => c.nombre?.toLowerCase() === (mv.category || '').toLowerCase()
          );
          this.form.get('categoriaId')!.setValue(cat ? cat.id : null);

          // Método de pago:
          // Si el backend ya manda metodoPagoId, úsalo. Si no, resuélvelo por nombre (mv.method)
          const metodoById = (mv as any).metodoPagoId as number | undefined;
          if (metodoById) {
            this.form.get('metodoPagoId')!.setValue(metodoById);
          } else if (mv.method) {
            const m = this.metodosPago.find(
              (x) => x.nombre.toLowerCase() === mv.method!.toLowerCase()
            );
            this.form.get('metodoPagoId')!.setValue(m ? m.id : null);
          }

          // ========= Persona (resolver por id o por nombre) =========
          const personaId = (mv as any).personaId as number | undefined;
          const personaNombre = (mv.memberName || '').trim();

          if (personaId && personaNombre) {
            // Caso ideal: id + nombre
            this.personaSeleccionada = { id: personaId, nombre: personaNombre };
            this.personaQuery.setValue(personaNombre, { emitEvent: false });
            this.form.get('personaId')?.setValue(personaId);
          } else if (personaId && !personaNombre) {
            // Sin nombre (si más adelante tienes endpoint por id, colócalo aquí)
            this.personaSeleccionada = null;
            this.personaQuery.setValue('', { emitEvent: false });
            this.form.get('personaId')?.reset();
          } else if (!personaId && personaNombre) {
            // Fallback real de tu API: viene solo el nombre -> resolvemos el ID por nombre
            this.personaQuery.setValue(personaNombre, { emitEvent: false });

            this.miembrosSvc
              .buscarMin$(personaNombre)
              .pipe(take(1))
              .subscribe({
                next: (lista: PersonaMini[]) => {
                  const match = lista.find(
                    (p) =>
                      (p.nombre || '').trim().toLowerCase() ===
                      personaNombre.toLowerCase()
                  );
                  if (match) {
                    this.personaSeleccionada = match;
                    this.form.get('personaId')?.setValue(match.id);
                  } else if (lista.length === 1) {
                    this.personaSeleccionada = lista[0];
                    this.form.get('personaId')?.setValue(lista[0].id);
                  } else {
                    this.personaSeleccionada = null;
                    this.form.get('personaId')?.reset();
                  }
                },
                error: () => {
                  this.personaSeleccionada = null;
                  this.form.get('personaId')?.reset();
                },
              });
          } else {
            // No vino nada -> requerido hasta que el usuario seleccione
            this.personaSeleccionada = null;
            this.personaQuery.setValue('', { emitEvent: false });
            this.form.get('personaId')?.reset();
          }
        }
      });
    });

    // Si cambia el tipo, recargar categorías y limpiar selección
    this.form.get('type')!.valueChanges.subscribe((t) => {
      const tipo = (t as 'Ingreso' | 'Egreso') || 'Ingreso';
      this.loadCategorias(tipo);
      this.form.get('categoriaId')!.reset(null);
    });

    // Autocomplete Personas
    this.personas$ = this.personaQuery.valueChanges.pipe(
      startWith(''),
      debounceTime(250),
      map((v) => (v || '').toString().trim()),
      distinctUntilChanged(),
      switchMap((q: string) =>
        q.length < 2 ? of([]) : this.miembrosSvc.buscarMin$(q)
      )
    );
  }

  // ========= catálogos =========

  private loadMetodosPago(after?: () => void) {
    this.fin.getMetodosPago().subscribe({
      next: (list) => {
        this.metodosPago = list || [];
        after?.();
      },
      error: (e) => {
        console.error('Error cargando métodos de pago', e);
        this.metodosPago = [];
        after?.();
      },
    });
  }

  private loadCategorias(tipo: 'Ingreso' | 'Egreso', afterLoad?: () => void) {
    this.fin.getCategoriasPorTipo(tipo).subscribe({
      next: (list) => {
        this.categorias = (list || []).filter(
          c =>
            !['diezmo', 'diezmos'].includes((c.nombre || '').trim().toLowerCase())
        );
        afterLoad?.();
      },
      error: (e) => {
        console.error('Error cargando categorías', e);
        this.categorias = [];
        afterLoad?.();
      },
    });
  }

  // ========= personas =========

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

  // ========= guardar =========

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const payload: CrearMovimientoReq = {
      tipo: v.type!,
      // 👇 evita usar toISOString(); formatea como YYYY-MM-DD en local
      fecha: this.formatLocalYmd(v.date as Date),
      concepto: '', // seguimos usando notas para el detalle libre
      cantidad: Number(v.amount),
      metodoPagoId: v.metodoPagoId!, // 👈 ahora sale del select (ID)
      personaId: (v.personaId as number) || undefined,
      categoriaId: (v.categoriaId as number) || undefined,
      observaciones: v.notes || '',
    };

    if (this.isEdit && this.data.movement?.id) {
      this.fin
        .updateMovement(this.data.treasuryId, this.data.movement.id, payload)
        .subscribe({
          next: () => this.ref.close(true),
          error: (err) => console.error('Error al actualizar movimiento', err),
        });
    } else {
      this.fin.addMovements(this.data.treasuryId, payload).subscribe({
        next: () => this.ref.close(true),
        error: (err) => console.error('Error al crear movimiento', err),
      });
    }
  }

  cancel() {
    this.ref.close();
  }
}
