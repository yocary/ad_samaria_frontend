import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FinanzasService, CrearDiezmoReq, DiezmoRow } from 'src/app/services/finanzas.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogAddDiezmoComponent } from './dialog-add-diezmo/dialog-add-diezmo.component';

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


  close(){ this.ref.close(); }
}