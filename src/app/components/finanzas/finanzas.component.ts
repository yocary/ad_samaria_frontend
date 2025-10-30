import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { debounceTime } from 'rxjs/operators';
import { Router } from '@angular/router';

import { FinanzasService } from 'src/app/services/finanzas.service';
import { TesoreriaRow, Treasury } from 'src/app/models/finanzas.model';
import { DialogAddTreasuryComponent } from './dialogs/dialog-add-treasury/dialog-add-treasury.component';
import { DialogTreasuryDetailComponent } from './dialogs/dialog-treasury-detail/dialog-treasury-detail.component';
// Si usas el detalle o movimientos, puedes importar sus diálogos cuando los integres
// import { DialogTreasuryDetailComponent } from './dialogs/dialog-treasury-detail/dialog-treasury-detail.component';
// import { DialogMovementComponent } from './dialogs/dialog-movement/dialog-movement.component';

@Component({
  selector: 'app-finanzas',
  templateUrl: './finanzas.component.html',
  styleUrls: ['./finanzas.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FinanzasComponent implements OnInit {

  treasuries: Treasury[] = [];
  selected: Treasury | null = null;

  searchTreas = new FormControl('');

  // Debe coincidir con tu HTML (matColumnDef="name|ingresos|egresos")
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
        const mapped = this.finanzasSvc.mapToUI(rows); // nombre/ingresos/egresos -> name/incomes/expenses
        // Mantener selección si existe; si no, seleccionar primera
        const prevId = this.selected?.id ?? null;
        this.treasuries = mapped;
        this.selected = prevId
          ? (this.treasuries.find(t => t.id === prevId) ?? this.treasuries[0] ?? null)
          : (this.treasuries[0] ?? null);
      },
      error: (err) => console.error('Error al cargar tesorerías', err)
    });
  }

  // ------- Filtro por estado desde chips -------
  setStatusFilter(s: 'Inactivo' | 'Activo' | 'Todos'): void {
    const map = { Inactivo: 'inactivas', Activo: 'activas', Todos: 'todas' } as const;
    this.estadoActual = map[s];
    this.loadTesorerias(this.searchTreas.value || '');
  }

  // ------- Selección de tesorería (para KPIs) -------
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
    data: { treasuryId: t.id }     // <<--- AQUI SE ENVÍA EL ID
  }).afterClosed().subscribe(changed => {
    if (changed) this.loadTesorerias(this.searchTreas.value || '');
  });
}
  // ------- Crear tesorería -------
  openAddTesoreria(): void {
    const ref = this.dialog.open(DialogAddTreasuryComponent, { width: '460px' });
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        // refrescar listado; selected se mantiene si coincide el id
        this.loadTesorerias(this.searchTreas.value || '');
        this.loadResumen?.();
      }
    });
  }

  // ------- (Hook opcional si luego usas KPIs globales) -------
  loadResumen(): void {
    // Si después necesitas un resumen global:
    // this.finanzasSvc.getResumenGeneral(this.periodoActual).subscribe(r => { ... });
  }

  // ------- Navegación -------
  regresar(): void {
    this.router.navigate(['/dashboard']);
  }
}
