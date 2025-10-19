// src/app/pages/miembros/member-card-dialog/member-card-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MiembrosService, PersonaFicha } from 'src/app/services/miembros.service';
import Swal from 'sweetalert2';

interface DialogData {
  personaId: number;
  nombre?: string; // opcional, por si quieres mostrar algo mientras carga
}

@Component({
  selector: 'app-member-card-dialog',
  templateUrl: './member-card-dialog.component.html',
  styleUrls: ['./member-card-dialog.component.scss']
})
export class MemberCardDialogComponent implements OnInit {
  loading = true;
  ficha: PersonaFicha | null = null;

  constructor(
    private ref: MatDialogRef<MemberCardDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private miembros: MiembrosService
  ) {}

  ngOnInit(): void {
    if (!this.data?.personaId) {
      Swal.fire('Aviso', 'No se recibió el ID de la persona.', 'warning');
      this.close();
      return;
    }

    this.miembros.getFicha(this.data.personaId).subscribe({
      next: (res) => { this.ficha = res; this.loading = false; },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudo cargar la ficha del miembro.', 'error');
        this.close();
      }
    });
  }

  close() { this.ref.close(); }

  // Helpers seguros
  safe(s?: string | null): string { return (s || '').trim(); }
  hasArray<T>(arr?: T[]): boolean { return !!arr && arr.length > 0; }
}
