import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { FinanzasService } from 'src/app/services/finanzas.service';
import { TesoreriaRow, Treasury } from 'src/app/models/finanzas.model';
import { DialogAddTreasuryComponent } from './dialogs/dialog-add-treasury/dialog-add-treasury.component';
import { DialogTreasuryDetailComponent } from './dialogs/dialog-treasury-detail/dialog-treasury-detail.component';
import * as XLSX from 'xlsx';
import { DialogDiezmosComponent } from './dialogs/dialog-diezmos/dialog-diezmos.component';
import { AuthService } from 'src/app/services/auth.service';

import { MatDatepicker } from '@angular/material/datepicker';

@Component({
  selector: 'app-finanzas',
  templateUrl: './finanzas.component.html',
  styleUrls: ['./finanzas.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class FinanzasComponent implements OnInit, OnDestroy {

  treasuries: Treasury[] = [];
  selected: Treasury | null = null;

  // Totales GLOBALes
  totIngresos = 0;
  totEgresos  = 0;
  get totSaldo(): number { return this.totIngresos - this.totEgresos; }

  // Búsqueda y filtros
  searchTreas = new FormControl('');
  displayedTreColumns = ['name', 'ingresos', 'egresos'];
  estadoActual: 'activas' | 'inactivas' | 'todas' = 'activas';
  periodoActual: 'mes' | 'mes_anterior' | 'anio' | 'todos' = 'mes';

  // Rol Pastor → muestra botón Diezmos
  isPastor = false;
  private authSub?: Subscription;

  // Selector de mes para el reporte (guardamos el 1er día del mes)
  monthCtrl: FormControl = new FormControl(new Date());
  maxMonth = new Date(); // tope: mes actual

  constructor(
    private finanzasSvc: FinanzasService,
    private dialog: MatDialog,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // Normaliza el valor inicial al 1 del mes actual
    const now = new Date();
    this.monthCtrl.setValue(new Date(now.getFullYear(), now.getMonth(), 1));

    this.loadTesorerias();

    // Búsqueda (debounced)
    this.searchTreas.valueChanges
      .pipe(debounceTime(300))
      .subscribe(q => this.loadTesorerias(q || ''));

    // Detectar rol PASTOR / ROLE_PASTOR
    this.authSub = this.auth.usuario.subscribe(u => {
      const roles = (u?.roles || []).map(r => (r || '').toUpperCase());
      this.isPastor = roles.includes('PASTOR') || roles.includes('ROLE_PASTOR');
    });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
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
        this.selected = prevId
          ? (this.treasuries.find(t => t.id === prevId) ?? this.treasuries[0] ?? null)
          : (this.treasuries[0] ?? null);

        this.recalcTotals();
      },
      error: (err) => console.error('Error al cargar tesorerías', err)
    });
  }

  private recalcTotals(): void {
    const list = this.treasuries || [];
    this.totIngresos = list.reduce((acc, t) => acc + (t.incomes  || 0), 0);
    this.totEgresos  = list.reduce((acc, t) => acc + (t.expenses || 0), 0);
  }

  setStatusFilter(s: 'Inactivo' | 'Activo' | 'Todos'): void {
    const map = { Inactivo: 'inactivas', Activo: 'activas', Todos: 'todas' } as const;
    this.estadoActual = map[s];
    this.loadTesorerias(this.searchTreas.value || '');
  }

  selectTreasury(t: Treasury) {
    if (!t || t.id == null) return;
    this.selected = t;

    this.dialog.open(DialogTreasuryDetailComponent, {
      width: '1100px',
      maxWidth: '98vw',
      disableClose: false,
      autoFocus: false,
      data: { treasuryId: t.id, treasuryName: t.name }
    }).afterClosed().subscribe(() => {
      this.loadTesorerias(this.searchTreas.value || '');
    });
  }

  openAddTesoreria(): void {
    const ref = this.dialog.open(DialogAddTreasuryComponent, { width: '460px' });
    ref.afterClosed().subscribe(ok => ok && this.loadTesorerias(this.searchTreas.value || ''));
  }

  regresar(): void {
    this.router.navigate(['/dashboard']);
  }

  downloadExcel(): void {
    const rows = (this.treasuries || []).map(t => ({
      'Tesorería': t.name,
      'Ingresos': t.incomes,
      'Egresos': t.expenses,
      'Saldo': (t.incomes || 0) - (t.expenses || 0)
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tesorerías');
    const fecha = new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb, `tesorerias_${fecha}.xlsx`);
  }

  openDiezmos(): void {
    this.dialog.open(DialogDiezmosComponent, {
      width: '980px',
      maxWidth: '98vw',
      panelClass: 'dlg-diezmos',
      disableClose: true
    });
  }

  // ====== Selector de Mes ======

  // Texto a mostrar: "MM/yyyy"
  get displayMonth(): string {
    const d = this.monthCtrl.value;
    if (!d) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${yyyy}`;
  }

  // El usuario elige un mes en el calendario
  chosenMonthHandler(date: Date, datepicker: MatDatepicker<Date>) {
    const normalized = new Date(date.getFullYear(), date.getMonth(), 1);
    const max = new Date(this.maxMonth.getFullYear(), this.maxMonth.getMonth(), 1);

    // Evitar meses futuros
    if (normalized <= max) {
      this.monthCtrl.setValue(normalized);
      // (Opcional) refrescar listado si lo quieres dependiente del mes:
      // this.loadTesorerias(this.searchTreas.value || '');
    }
    datepicker.close();
  }

  private formatMonthISO(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  // ====== Reporte por Mes Seleccionado ======
  downloadReporte(): void {
    const selected = this.monthCtrl.value ?? new Date();
    const mesISO = this.formatMonthISO(selected);

    this.finanzasSvc.downloadFinanzasPdfTodas(mesISO).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finanzas_${mesISO}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      },
      error: (e) => console.error('No se pudo descargar el PDF', e),
    });
  }
}
