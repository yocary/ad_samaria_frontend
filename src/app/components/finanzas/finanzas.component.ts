import {
  Component,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectorRef,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { FinanzasService } from 'src/app/services/finanzas.service';
import { Treasury } from 'src/app/models/finanzas.model';
import { DialogTreasuryDetailComponent } from './dialogs/dialog-treasury-detail/dialog-treasury-detail.component';
import { MatDatepicker } from '@angular/material/datepicker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { DialogAddTreasuryComponent } from './dialogs/dialog-add-treasury/dialog-add-treasury.component';
import { DialogDiezmosComponent } from './dialogs/dialog-diezmos/dialog-diezmos.component';
import { AuthService } from 'src/app/services/auth.service';
import { PageEvent } from '@angular/material/paginator';

type MGPeriod = 'mes' | 'mes_anterior' | 'anio' | 'todos';

interface MovimientoGeneralRow {
  treasuryId: number;
  treasury: string;
  categoryId: number;
  category: string;
  type: 'Ingreso' | 'Egreso';
  fecha: string;
  amount: number;
}

@Component({
  selector: 'app-finanzas',
  templateUrl: './finanzas.component.html',
  styleUrls: ['./finanzas.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FinanzasComponent implements OnInit, OnDestroy {
  // ===== KPIs
  totIngresos = 0;
  totEgresos = 0;
  get totSaldo(): number {
    return this.totIngresos - this.totEgresos;
  }

  loadingTreas = false;

  // ===== Selector de Mes Único
  monthCtrl: FormControl = new FormControl(new Date());
  maxMonth = new Date();

  tabIndex = 0;
  canDownload = false;

  // ===== Movimientos generales
  searchGen = new FormControl('');
  movimientosGenerales: MovimientoGeneralRow[] = [];

  // Paginación (client-side) + MatPaginator
  mgPaged: MovimientoGeneralRow[] = [];
  pageIndex = 0;
  readonly pageSize = 10; // ← siempre 10 por página
  total = 0;
  get totalPages(): number {
    return this.pageSize ? Math.ceil(this.total / this.pageSize) : 0;
  }

  // Para poder usar Math.min en el template (si lo necesitas en otros lugares)
  readonly Math = Math;

  // ===== Tesorerías
  treasuries: Treasury[] = [];

  isPastor = false;
  private authSub?: Subscription;
  private subs = new Subscription();

  constructor(
    private fin: FinanzasService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.authSub = this.auth.usuario.subscribe((u) => {
      const roles = (u?.roles || []).map((r) => (r || '').toUpperCase());
      this.isPastor = roles.includes('PASTOR') || roles.includes('ROLE_PASTOR');
    });

    this.loadMovimientosGenerales();
    this.loadTesorerias();

    // Buscar con debounce
    this.subs.add(
      this.searchGen.valueChanges.pipe(debounceTime(250)).subscribe(() => {
        this.pageIndex = 0; // reset
        this.loadMovimientosGenerales();
      })
    );

    // Cambios en el mes
    this.subs.add(
      this.monthCtrl.valueChanges.subscribe((selectedDate) => {
        if (selectedDate) {
          this.pageIndex = 0; // reset
          this.loadMovimientosGenerales();
          this.loadTesorerias();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.authSub?.unsubscribe();
  }

  // ===================== MOVIMIENTOS GENERALES =====================
  private loadMovimientosGenerales() {
    const q = (this.searchGen.value || '').toString().trim();
    const fechaSeleccionada = this.monthCtrl.value;
    const mesISO = this.formatMonthISO(fechaSeleccionada);

    this.movimientosGenerales = [];
    this.mgPaged = [];
    this.totIngresos = 0;
    this.totEgresos = 0;
    this.canDownload = false;

    this.subs.add(
      this.fin
        .getMovimientosGenerales({ periodo: 'mes', mes: mesISO, q })
        .subscribe(
          (resp: any) => {
            const items = (resp?.items ?? []) as MovimientoGeneralRow[];
            this.movimientosGenerales = items;

            // KPI
            if (resp?.totales) {
              this.totIngresos = Number(resp.totales.ingresos || 0);
              this.totEgresos = Number(resp.totales.egresos || 0);
            } else {
              this.totIngresos = items
                .filter((r) => r.type === 'Ingreso')
                .reduce((a, r) => a + (r.amount || 0), 0);
              this.totEgresos = items
                .filter((r) => r.type === 'Egreso')
                .reduce((a, r) => a + (r.amount || 0), 0);
            }

            // Paginación
            this.total = this.movimientosGenerales.length;
            this.pageIndex = 0; // reset al cargar
            this.applyPaging();

            this.canDownload = this.total > 0;
          },
          (_) => {
            this.movimientosGenerales = [];
            this.mgPaged = [];
            this.total = 0;
            this.totIngresos = 0;
            this.totEgresos = 0;
            this.canDownload = false;
          }
        )
    );
  }

  private applyPaging(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.mgPaged = this.movimientosGenerales.slice(start, end);
  }

  // Evento del MatPaginator (como en Miembros)
  onMgPage(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.applyPaging();
  }

  // ===================== TESORERÍAS =====================
  private loadTesorerias() {
    const fechaSeleccionada = this.monthCtrl.value;
    const periodo = this.convertirFechaAPeriodo(fechaSeleccionada);

    this.subs.add(
      this.fin
        .getTesorerias({ estado: 'activas', periodo })
        .subscribe((rows) => {
          this.treasuries = this.fin.mapToUI(rows || []);
        })
    );
  }

  // ===================== CONVERSIÓN FECHA A PERIODO =====================
  private convertirFechaAPeriodo(fecha: Date): MGPeriod {
    const ahora = new Date();
    const fechaSeleccionada = new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      1
    );
    const mesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const inicioAnio = new Date(ahora.getFullYear(), 0, 1);

    if (fechaSeleccionada.getTime() === mesActual.getTime()) {
      return 'mes';
    } else if (fechaSeleccionada.getTime() === mesAnterior.getTime()) {
      return 'mes_anterior';
    } else if (
      fechaSeleccionada >= inicioAnio &&
      fechaSeleccionada <= mesActual
    ) {
      return 'anio';
    } else {
      return 'todos';
    }
  }

  openTreasury(t: Treasury) {
    if (!t?.id) return;
    this.dialog
      .open(DialogTreasuryDetailComponent, {
        width: '960px',
        disableClose: true,
        data: { treasuryId: t.id, treasuryName: t.name },
      })
      .afterClosed()
      .subscribe((result: any) => {
        if (result?.changed || result?.reloadFinanzas) {
          this.loadTesorerias();
          this.loadMovimientosGenerales();
        }
      });
  }

  // ===================== SELECTOR DE MES =====================
  downloadReporte() {
    if (!this.canDownload) {
      this.snack.open(
        'No hay datos para generar el reporte en el mes seleccionado.',
        'OK',
        { duration: 3000 }
      );
      return;
    }

    const mesAnio = this.formatMonthISO(this.monthCtrl.value);

    this.fin.downloadFinanzasPdfTodas(mesAnio).subscribe(
      (data) => {
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte-finanzas-${mesAnio}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      (error) => {
        console.error('Error al descargar reporte:', error);
        this.snack.open('No se pudo generar el PDF.', 'OK', { duration: 3000 });
      }
    );
  }

  get displayMonth(): string {
    const d = this.monthCtrl.value;
    if (!d) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${yyyy}`;
  }

  chosenMonthHandler(date: Date, datepicker: MatDatepicker<Date>) {
    const normalized = new Date(date.getFullYear(), date.getMonth(), 1);
    const hoy = new Date();
    const max = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    if (normalized <= max) this.monthCtrl.setValue(normalized);
    else this.monthCtrl.setValue(this.monthCtrl.value);

    datepicker.close();
  }

  private formatMonthISO(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  // ===================== TRACK BY =====================
  trackByMg = (_: number, r: MovimientoGeneralRow) =>
    `${r.treasuryId}-${r.categoryId}-${r.type}-${r.fecha}-${r.amount}`;
  trackByTreas = (_: number, t: Treasury) => t.id;

  back() {
    this.router.navigate(['/dashboard']);
  }

  openAddTesoreria(): void {
    const ref = this.dialog.open(DialogAddTreasuryComponent, {
      width: '460px',
      disableClose: true,
    });

    this.subs.add(
      ref.afterClosed().subscribe((ok: boolean) => {
        if (ok) {
          this.tabIndex = 1;
          this.loadTesorerias();
          this.loadMovimientosGenerales();
          this.snack.open('Tesorería creada con éxito', 'OK', {
            duration: 2000,
          });
          this.cdr.markForCheck();
        }
      })
    );
  }

  openDiezmos(): void {
    this.dialog.open(DialogDiezmosComponent, {
      width: '980px',
      maxWidth: '98vw',
      panelClass: 'dlg-diezmos',
      disableClose: true,
    });
  }
}
