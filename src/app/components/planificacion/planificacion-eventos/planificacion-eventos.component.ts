// src/app/components/planificacion/planificacion-eventos/planificacion-eventos.component.ts
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { LiderazgoService } from 'src/app/services/liderazgo.service';
import { EventoItem } from './tipos';
import { EventoNewDialogComponent } from '../evento-new-dialog/evento-new-dialog.component';
import { EventoNewPayload } from './tipos';

@Component({
  selector: 'app-planificacion-eventos',
  templateUrl: './planificacion-eventos.component.html',
  styleUrls: ['./planificacion-eventos.component.scss']
})
export class PlanificacionEventosComponent implements OnInit, OnDestroy {
  @Input() liderazgoId!: number;
  @Input() liderazgoNombre?: string;

  cargando = true;
  creando  = false;

  // NO usar genéricos en FormControl si tu versión de Angular no los soporta
  search      = new FormControl('');
  reporteCtrl = new FormControl('Listado');
  exportCtrl  = new FormControl('CSV');

  eventos: EventoItem[]   = [];
  filtrados: EventoItem[] = [];
  displayed = ['n', 'nombre', 'fecha', 'asist', 'visit', 'total', 'acciones'];

  private destroy$ = new Subject<void>();

  constructor(
    private lidSvc: LiderazgoService,
    private dialog: MatDialog
  ) {}

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
        this.eventos = list || [];
        this.applyFilter(this.search.value as string || '');
        this.cargando = false;
      },
      error: () => {
        this.eventos = [];
        this.filtrados = [];
        this.cargando = false;
        Swal.fire('Error', 'No se pudieron cargar los eventos.', 'error');
      }
    });
  }

  applyFilter(q: string): void {
    const s = (q || '').toLowerCase().trim();
    this.filtrados = !s
      ? [...this.eventos]
      : this.eventos.filter(e =>
          (e.nombre || '').toLowerCase().includes(s) ||
          (e.fecha  || '').toLowerCase().includes(s)
        );
  }

  openCrear(): void {
    const ref = this.dialog.open(EventoNewDialogComponent, {
      width: '520px',
      data: { liderazgoNombre: this.liderazgoNombre }
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
        }
      });
    });
  }

  abrirAsistencia(e: EventoItem): void {
    Swal.fire('Asistencia', `Abrir control de asistencia para: ${e.nombre}`, 'info');
  }

  abrirObservacion(e: EventoItem): void {
    Swal.fire({
      title: 'Observación',
      input: 'textarea',
      inputLabel: `Observación para "${e.nombre}"`,
      inputPlaceholder: 'Escribe aquí...',
      showCancelButton: true,
      confirmButtonText: 'Guardar'
    }).then(res => {
      if (!res.isConfirmed) return;
      Swal.fire('Guardado', 'Observación registrada.', 'success');
    });
  }

  exportar(): void {
    const fmt = this.exportCtrl.value;
    if (fmt === 'CSV') this.exportCSV();
    else this.exportXLSX();
  }

  private exportCSV(): void {
    const rows = [
      ['No.', 'Nombre', 'Fecha', 'Asistencias', 'Visitantes', 'Total'],
      ...this.filtrados.map((e, i) => [
        `${i + 1}`, e.nombre, e.fecha, `${e.asistencias}`, `${e.visitantes}`, `${e.total}`
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `eventos_${this.liderazgoId}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  private exportXLSX(): void {
    const rows = [
      ['No.', 'Nombre', 'Fecha', 'Asistencias', 'Visitantes', 'Total'],
      ...this.filtrados.map((e, i) => [
        `${i + 1}`, e.nombre, e.fecha, `${e.asistencias}`, `${e.visitantes}`, `${e.total}`
      ])
    ];
    const tsv = rows.map(r => r.join('\t')).join('\n');
    const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `eventos_${this.liderazgoId}.xls`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
