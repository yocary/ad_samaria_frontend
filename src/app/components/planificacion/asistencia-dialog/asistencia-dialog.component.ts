// src/app/components/planificacion/asistencia-dialog/asistencia-dialog.component.ts
import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import Swal from 'sweetalert2';

import { LiderazgoService, AsistenciaItem, AsistenciaUpsert } from 'src/app/services/liderazgo.service';

interface DialogData {
  liderazgoId: number;
  liderazgoNombre?: string;
  eventoId: number;
  eventoNombre: string;
  fecha?: string;
}

@Component({
  selector: 'app-asistencia-dialog',
  templateUrl: './asistencia-dialog.component.html',
  styleUrls: ['./asistencia-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AsistenciaDialogComponent implements OnInit {
  loading = true;
  saving  = false;

  filtro = new FormControl('');
  asistencia: AsistenciaItem[] = [];
  filtrados: AsistenciaItem[]  = [];

  constructor(
    private ref: MatDialogRef<AsistenciaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private lidSvc: LiderazgoService
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.filtro.valueChanges.subscribe(v => this.applyFilter(String(v ?? '')));
  }

  private cargar(): void {
    this.loading = true;
    this.lidSvc.listarAsistencia(this.data.liderazgoId, this.data.eventoId).subscribe({
      next: (res) => {
        this.asistencia = (res || []).map(r => ({ ...r, presente: !!r.presente }));
        this.applyFilter(this.filtro.value as string || '');
        this.loading = false;
      },
      error: () => {
        this.asistencia = [];
        this.filtrados = [];
        this.loading = false;
        Swal.fire('Error', 'No se pudo cargar la asistencia.', 'error');
      }
    });
  }

  applyFilter(q: string): void {
    const s = (q || '').trim().toLowerCase();
    this.filtrados = !s
      ? [...this.asistencia]
      : this.asistencia.filter(a => (a.nombre || '').toLowerCase().includes(s));
  }

  toggleAll(presente: boolean): void {
    this.filtrados.forEach(a => (a.presente = presente));
  }

  guardar(): void {
    const payload: AsistenciaUpsert[] = this.asistencia.map(a => ({
      personaId: a.personaId,
      presente: !!a.presente
      // observacion: opcional
    }));

    this.saving = true;
    this.lidSvc.guardarAsistencia(this.data.liderazgoId, this.data.eventoId, payload).subscribe({
      next: () => {
        this.saving = false;
        Swal.fire('Listo', 'Asistencia guardada correctamente.', 'success');
        this.ref.close(true);
      },
      error: () => {
        this.saving = false;
        Swal.fire('Error', 'No se pudo guardar la asistencia.', 'error');
      }
    });
  }

  close(): void { this.ref.close(false); }

  trackById = (_: number, it: AsistenciaItem) => it.personaId;
}
