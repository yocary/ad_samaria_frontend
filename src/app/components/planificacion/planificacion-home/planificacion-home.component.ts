// src/app/components/planificacion/planificacion-home/planificacion-home.component.ts
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { GruposService, Grupo } from 'src/app/services/grupo.service';
import { CreateGrupoDialogComponent } from '../create-grupo-dialog/create-grupo-dialog.component';

@Component({
  selector: 'app-planificacion-home',
  templateUrl: './planificacion-home.component.html',
  styleUrls: ['./planificacion-home.component.scss']
})
export class PlanificacionHomeComponent implements OnInit {
  cargando = true;
  grupos: Grupo[] = [];

  palette = ['teal', 'green', 'amber', 'blue', 'purple'];

  constructor(
    private gruposSvc: GruposService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarGrupos();
  }

  cargarGrupos(): void {
    this.cargando = true;
    this.gruposSvc.listar().subscribe({
      next: (res: Grupo[]) => { this.grupos = res || []; this.cargando = false; },
      error: () => { this.grupos = []; this.cargando = false; }
    });
  }

  crearGrupo(): void {
    const ref = this.dialog.open(CreateGrupoDialogComponent, {
      width: '520px',
      disableClose: true
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.cargarGrupos(); });
  }

  verGrupo(id: number): void {
    this.router.navigate(['/planificacion/grupo', id]);
  }

  regresar(): void { this.router.navigate(['/dashboard']); }

  colorClass(i: number): string {
    return `c-${this.palette[i % this.palette.length]}`;
  }

  // === Resuelve estado de tesorería con cualquier forma de payload ===
  getTesoreriaActiva(g: Grupo): boolean {
    if (typeof g.tesoreria === 'boolean') return g.tesoreria;
    if (g.tesoreriaId !== undefined) return !!g.tesoreriaId; // tiene id => la consideramos “activa”
    return false; // fallback
  }
}
