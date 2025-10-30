import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime } from 'rxjs/operators';
import { Router } from '@angular/router';

import { FinanzasService } from 'src/app/services/finanzas.service';
import { TesoreriaRow, Treasury } from 'src/app/models/finanzas.model';
import { DialogAddTreasuryComponent } from './dialogs/dialog-add-treasury/dialog-add-treasury.component';
import { DialogTreasuryDetailComponent } from './dialogs/dialog-treasury-detail/dialog-treasury-detail.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-finanzas',
  templateUrl: './finanzas.component.html',
  styleUrls: ['./finanzas.component.scss'],
  encapsulation: ViewEncapsulation.Emulated   
})
export class FinanzasComponent implements OnInit {

  treasuries: Treasury[] = [];
  selected: Treasury | null = null;

  // Totales GLOBALes
  totIngresos = 0;
  totEgresos  = 0;
  get totSaldo(): number { return this.totIngresos - this.totEgresos; }

  searchTreas = new FormControl('');

  displayedTreColumns = ['name', 'ingresos', 'egresos'];

  // Filtros actuales
  estadoActual: 'activas' | 'inactivas' | 'todas' = 'activas';
  periodoActual: 'mes' | 'mes_anterior' | 'anio' | 'todos' = 'mes';

  constructor(
    private finanzasSvc: FinanzasService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTesorerias();

    // Búsqueda (debounced)
    this.searchTreas.valueChanges
      .pipe(debounceTime(300))
      .subscribe(q => this.loadTesorerias(q || ''));
  }

  // ------- Cargar listado -------
  loadTesorerias(q: string = ''): void {
    this.finanzasSvc.getTesorerias({
      estado: this.estadoActual,
      q,
      periodo: this.periodoActual
    }).subscribe({
      next: (rows: TesoreriaRow[]) => {
        const mapped = this.finanzasSvc.mapToUI(rows);
        const prevId = this.selected?.id ?? null;

        this.treasuries = mapped;
        // Selección opcional (aunque los KPI ya no dependen del seleccionado)
        this.selected = prevId
          ? (this.treasuries.find(t => t.id === prevId) ?? this.treasuries[0] ?? null)
          : (this.treasuries[0] ?? null);

        // Recalcular KPI GLOBAL
        this.recalcTotals();
      },
      error: (err) => console.error('Error al cargar tesorerías', err)
    });
  }

  // ------- Recalcular totales globales -------
  private recalcTotals(): void {
    const list = this.treasuries || [];
    this.totIngresos = list.reduce((acc, t) => acc + (t.incomes  || 0), 0);
    this.totEgresos  = list.reduce((acc, t) => acc + (t.expenses || 0), 0);
  }

  // ------- Filtro por estado desde chips -------
  setStatusFilter(s: 'Inactivo' | 'Activo' | 'Todos'): void {
    const map = { Inactivo: 'inactivas', Activo: 'activas', Todos: 'todas' } as const;
    this.estadoActual = map[s];
    this.loadTesorerias(this.searchTreas.value || '');
  }

  // ------- Selección de tesorería (abre detalle) -------
  selectTreasury(t: Treasury) {
    if (!t || t.id == null) {
      console.error('Treasury sin id:', t);
      return;
    }
    this.selected = t;

    this.dialog.open(DialogTreasuryDetailComponent, {
      width: '1100px',
      maxWidth: '98vw',
      disableClose: false,
      autoFocus: false,
  data: { treasuryId: t.id, treasuryName: t.name }   // 👈 agrega esto
    }).afterClosed().subscribe(() => {
      // 🔁 Recargar listado y totales globales al cerrar el detalle
      this.loadTesorerias(this.searchTreas.value || '');
    });
  }

  // ------- Crear tesorería -------
  openAddTesoreria(): void {
    const ref = this.dialog.open(DialogAddTreasuryComponent, { width: '460px' });
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.loadTesorerias(this.searchTreas.value || '');
      }
    });
  }

  // ------- Navegación -------
  regresar(): void {
    this.router.navigate(['/dashboard']);
  }

  downloadExcel(): void {
  // 1) Prepara los datos tal como se ven en la tabla
  const rows = (this.treasuries || []).map(t => ({
    'Tesorería': t.name,
    'Ingresos': t.incomes,     // numérico
    'Egresos': t.expenses,     // numérico
    'Saldo': (t.incomes || 0) - (t.expenses || 0)
  }));

  // 2) Crea hoja y libro
  const ws = XLSX.utils.json_to_sheet(rows);

  // (opcional) ancho de columnas
  ws['!cols'] = [
    { wch: 28 }, // Tesorería
    { wch: 14 }, // Ingresos
    { wch: 14 }, // Egresos
    { wch: 14 }, // Saldo
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tesorerías');

  // 3) Nombre de archivo con fecha
  const fecha = new Date().toISOString().slice(0,10); // yyyy-mm-dd
  XLSX.writeFile(wb, `tesorerias_${fecha}.xlsx`);
}

}
