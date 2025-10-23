// src/app/components/planificacion/planificacion-eventos/planificacion-eventos.component.ts
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subject, forkJoin, of } from 'rxjs';
import { debounceTime, takeUntil, map, catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';

import {
  LiderazgoService,
  AsistenciaItem,
} from 'src/app/services/liderazgo.service';
import { EventoItem } from './tipos';
import { EventoNewDialogComponent } from '../evento-new-dialog/evento-new-dialog.component';
import { EventoNewPayload } from './tipos';
import { AsistenciaDialogComponent } from '../asistencia-dialog/asistencia-dialog.component';
import { OfrendaDialogComponent, OfrendaPayload } from '../ofrenda-dialog/ofrenda-dialog.component';

type EventoRow = EventoItem & { totalAsistencias?: number }; // extendemos con el total calculado

@Component({
  selector: 'app-planificacion-eventos',
  templateUrl: './planificacion-eventos.component.html',
  styleUrls: ['./planificacion-eventos.component.scss'],
})
export class PlanificacionEventosComponent implements OnInit, OnDestroy {
  @Input() liderazgoId!: number;
  @Input() liderazgoNombre?: string;

  cargando = true;
  creando = false;

  search = new FormControl('');
  reporteCtrl = new FormControl('Listado');
  exportCtrl = new FormControl('CSV');

  eventos: EventoRow[] = [];
  filtrados: EventoRow[] = [];
  displayed = ['n', 'nombre', 'fecha', 'totalAsistencias', 'acciones'];

  private destroy$ = new Subject<void>();

  constructor(private lidSvc: LiderazgoService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.cargar();

    this.search.valueChanges
      .pipe(debounceTime(250), takeUntil(this.destroy$))
      .subscribe((q: any) => this.applyFilter(String(q ?? '')));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargar(): void {
    if (!this.liderazgoId) return;
    this.cargando = true;

    this.lidSvc.listarEventos(this.liderazgoId).subscribe({
      next: (list) => {
        const base: EventoRow[] = (list || []).map((e) => ({ ...e }));
        this.eventos = base;
        this.applyFilter((this.search.value as string) || '');
        // calcular totales de asistencia en paralelo
        this.cargarTotalesAsistencia(base);
        this.cargando = false;
      },
      error: () => {
        this.eventos = [];
        this.filtrados = [];
        this.cargando = false;
        Swal.fire('Error', 'No se pudieron cargar los eventos.', 'error');
      },
    });
  }

  private cargarTotalesAsistencia(eventos: EventoRow[]): void {
    if (!eventos.length) return;

    const reqs = eventos.map((e) =>
      this.lidSvc.listarAsistencia(this.liderazgoId, e.id).pipe(
        map(
          (items: AsistenciaItem[]) =>
            items.filter((it) => !!it.presente).length
        ),
        catchError(() => of(undefined)) // si falla, dejamos undefined para no romper UI
      )
    );

    forkJoin(reqs).subscribe((totales) => {
      totales.forEach((t, i) => (eventos[i].totalAsistencias = t ?? undefined));
      // refrescar arreglo filtrado (por si hay binding a total)
      this.applyFilter((this.search.value as string) || '');
    });
  }

  applyFilter(q: string): void {
    const s = (q || '').toLowerCase().trim();
    const src = this.eventos;
    this.filtrados = !s
      ? [...src]
      : src.filter(
          (e) =>
            (e.nombre || '').toLowerCase().includes(s) ||
            (e.fecha || '').toLowerCase().includes(s)
        );
  }

  openCrear(): void {
    const ref = this.dialog.open(EventoNewDialogComponent, {
      width: '520px',
      data: { liderazgoNombre: this.liderazgoNombre },
    });

    ref.afterClosed().subscribe((payload?: EventoNewPayload) => {
      if (!payload) return;
      this.creando = true;
      this.lidSvc.crearEvento(this.liderazgoId, payload).subscribe({
        next: () => {
          this.creando = false;
          Swal.fire('Listo', 'Evento creado.', 'success');
          this.cargar();
        },
        error: () => {
          this.creando = false;
          Swal.fire('Error', 'No se pudo crear el evento.', 'error');
        },
      });
    });
  }

  abrirAsistencia(e: EventoItem): void {
    const ref = this.dialog.open(AsistenciaDialogComponent, {
      width: '720px',
      disableClose: true,
      data: {
        liderazgoId: this.liderazgoId,
        liderazgoNombre: this.liderazgoNombre,
        eventoId: e.id,
        eventoNombre: e.nombre,
        fecha: e.fecha,
      },
    });

    ref.afterClosed().subscribe((guardado: boolean) => {
      if (guardado) this.cargar(); // recargar para recalcular totales
    });
  }

abrirObservacion(e: EventoItem): void {
  // 1) Traer la observación actual (si la hay)
  this.lidSvc.obtenerObservacion(this.liderazgoId, e.id).subscribe({
    next: (res) => this.mostrarSwalObservacion(e, res?.observacion ?? ''),
    error: ()  => this.mostrarSwalObservacion(e, '') // si no hay, abrimos con vacío
  });
}

/** Muestra el Swal con el valor inicial y guarda */
private mostrarSwalObservacion(e: EventoItem, valorInicial: string): void {
  Swal.fire({
    title: 'Observación',
    input: 'textarea',
    inputLabel: `Observación para "${e.nombre}"`,
    inputPlaceholder: 'Escribe aquí...',
    inputValue: valorInicial,
    inputAttributes: { rows: '5' },
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    showLoaderOnConfirm: true,
    preConfirm: (texto) => {
      const observacion = (texto ?? '').toString().trim();
      return this.lidSvc
        .guardarObservacion(this.liderazgoId, e.id, observacion)
        .toPromise()
        .catch(() => {
          Swal.showValidationMessage('No se pudo guardar la observación.');
        });
    },
    allowOutsideClick: () => !Swal.isLoading()
  }).then((res) => {
    if (!res.isConfirmed) return;
    Swal.fire('Guardado', 'Observación registrada.', 'success');
    // (Opcional) refrescar listado o cachear localmente si llevas esa propiedad en memoria
    // this.cargar();
  });
}


  exportar(): void {
    const fmt = this.exportCtrl.value;
    if (fmt === 'CSV') this.exportCSV();
    else this.exportXLSX();
  }

  private exportCSV(): void {
    const rows = [
      ['No.', 'Nombre', 'Fecha', 'Total asistencias'],
      ...this.filtrados.map((e, i) => [
        `${i + 1}`,
        e.nombre,
        e.fecha,
        `${e.totalAsistencias ?? ''}`,
      ]),
    ];
    const csv = rows
      .map((r) =>
        r.map((c) => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `eventos_${this.liderazgoId}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  private exportXLSX(): void {
    const rows = [
      ['No.', 'Nombre', 'Fecha', 'Total asistencias'],
      ...this.filtrados.map((e, i) => [
        `${i + 1}`,
        e.nombre,
        e.fecha,
        `${e.totalAsistencias ?? ''}`,
      ]),
    ];
    const tsv = rows.map((r) => r.join('\t')).join('\n');
    const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `eventos_${this.liderazgoId}.xls`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

abrirOfrenda(e?: EventoItem): void {
  if (!e) return;

  // Primero cargar ofrendas existentes
  this.lidSvc.listarOfrendasPorEvento(e.id).subscribe({
    next: (ofrendas) => {
      const ofrendaExistente = ofrendas.length > 0 ? ofrendas[0] : undefined;
      
      const ref = this.dialog.open(OfrendaDialogComponent, {
        width: '420px',
        data: {
          liderazgoNombre: this.liderazgoNombre,
          eventos: this.eventos,
          eventoIdDefault: e.id,
          ofrendaExistente: ofrendaExistente
        }
      });

      ref.afterClosed().subscribe((payload?: OfrendaPayload) => {
        if (!payload) return;

        const { eventoId, id: ofrendaId, ...body } = payload;
        
        if (ofrendaId) {
          // Modo ACTUALIZACIÓN - usar el método de actualización
          this.lidSvc.actualizarOfrenda(ofrendaId, body).subscribe({
            next: () => {
              Swal.fire('Listo', 'Ofrenda actualizada.', 'success');
            },
            error: () => Swal.fire('Error', 'No se pudo actualizar la ofrenda.', 'error')
          });
        } else {
          // Modo CREACIÓN - crear nueva ofrenda
          this.lidSvc.crearOfrendaParaEvento(eventoId, body).subscribe({
            next: () => {
              Swal.fire('Listo', 'Ofrenda registrada.', 'success');
            },
            error: () => Swal.fire('Error', 'No se pudo registrar la ofrenda.', 'error')
          });
        }
      });
    },
    error: () => {
      // Si falla cargar ofrendas existentes, abrir diálogo en modo creación
      this.abrirDialogoOfrenda(e);
    }
  });
}

private abrirDialogoOfrenda(e: EventoItem): void {
  const ref = this.dialog.open(OfrendaDialogComponent, {
    width: '420px',
    data: {
      liderazgoNombre: this.liderazgoNombre,
      eventos: this.eventos,
      eventoIdDefault: e.id
    }
  });

  ref.afterClosed().subscribe((payload?: OfrendaPayload) => {
    if (!payload) return;

    const { eventoId, ...body } = payload;
    this.lidSvc.crearOfrendaParaEvento(eventoId, body).subscribe({
      next: () => {
        Swal.fire('Listo', 'Ofrenda registrada.', 'success');
      },
      error: () => Swal.fire('Error', 'No se pudo registrar la ofrenda.', 'error')
    });
  });
}
}
