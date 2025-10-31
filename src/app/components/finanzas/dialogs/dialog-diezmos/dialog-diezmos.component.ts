import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FinanzasService, DiezmoRow } from 'src/app/services/finanzas.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogAddDiezmoComponent } from './dialog-add-diezmo/dialog-add-diezmo.component';
import * as XLSX from 'xlsx';

/* ========= HELPERS DE FECHA (LOCAL) =========
 * Evitan el corrimiento de -1 día por UTC cuando se trabaja con "fecha" (solo día).
 */
function ymdToLocalDate(ymd: string): Date {
  const [y, m, d] = (ymd || '').slice(0, 10).split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1); // Fecha LOCAL
}
function parseToLocalDate(input?: string | Date | null): Date | null {
  if (!input) return null;
  if (input instanceof Date) return input;
  const s = String(input);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return ymdToLocalDate(s);
  if (s.includes('T')) return ymdToLocalDate(s.slice(0, 10)); // tomar solo YYYY-MM-DD
  return ymdToLocalDate(s);
}

@Component({
  selector: 'app-dialog-diezmos',
  templateUrl: './dialog-diezmos.component.html',
  styleUrls: ['./dialog-diezmos.component.scss'],
})
export class DialogDiezmosComponent implements OnInit {

  // KPI
  totIngresos = 0;
  totEgresos = 0;
  get totSaldo(){ return this.totIngresos - this.totEgresos; }

  // tabla
  rows: DiezmoRow[] = [];

  constructor(
    private fin: FinanzasService,
    private snack: MatSnackBar,
    private ref: MatDialogRef<DialogDiezmosComponent>,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  private reload(){
    this.fin.getDiezmos({}).subscribe(res => {
      this.rows = res.items || [];
      this.totIngresos = res.totales?.ingresos ?? 0;
      this.totEgresos  = res.totales?.egresos ?? 0;
    });
  }

  openAdd(){
    this.dialog.open(DialogAddDiezmoComponent, {
      width: '480px', disableClose: true
    }).afterClosed().subscribe(ok => ok && this.reload());
  }

  edit(row: DiezmoRow){
    this.dialog.open(DialogAddDiezmoComponent, {
      width: '480px', disableClose: true, data: row
    }).afterClosed().subscribe(ok => ok && this.reload());
  }

  remove(row: DiezmoRow) {
    this.fin.deleteDiezmo(row.id).subscribe({
      next: () => {
        this.snack.open('Eliminado', 'OK', { duration: 1500 });
        this.reload();
      },
      error: () => {
        this.snack.open('No se pudo eliminar', 'OK', { duration: 2000 });
      }
    });
  }

  // ===== Descargar Excel =====
  downloadExcel(): void {
    // Mapea lo visible en la tabla
    const data = (this.rows || []).map((r, idx) => ({
      'No.': idx + 1,
      'Nombre': r.nombre || '',
      // Fecha como Date LOCAL para que Excel no reste 1 día
      'Fecha': r.fecha ? parseToLocalDate(r.fecha as any) : null,
      'Tipo': r.tipo || '',
      'Cantidad': Number(r.cantidad || 0),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    // Ancho de columnas para mejor lectura
    ws['!cols'] = [
      { wch: 6 },   // No.
      { wch: 30 },  // Nombre
      { wch: 12 },  // Fecha
      { wch: 12 },  // Tipo
      { wch: 14 },  // Cantidad
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Diezmos');

    const hoy = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
    const file = `diezmos_${hoy}.xlsx`;
    XLSX.writeFile(wb, file, { cellDates: true });
  }

  close(){ this.ref.close(); }
}
