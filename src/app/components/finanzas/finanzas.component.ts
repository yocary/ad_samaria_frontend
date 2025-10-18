import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime } from 'rxjs/operators';
import { FinanzasService } from 'src/app/services/finanzas.service';
import { Treasury, Movement } from 'src/app/models/finanzas.model';
import { DialogAddTreasuryComponent } from './dialogs/dialog-add-treasury/dialog-add-treasury.component';
import { DialogMovementComponent } from './dialogs/dialog-movement/dialog-movement.component'; 
import { DialogTreasuryDetailComponent } from './dialogs/dialog-treasury-detail/dialog-treasury-detail.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-finanzas',
  templateUrl: './finanzas.component.html',
  styleUrls: ['./finanzas.component.scss'],
  encapsulation: ViewEncapsulation.None 
})
export class FinanzasComponent implements OnInit {
  treasuries: Treasury[] = [];
  selected?: Treasury | null;

  searchTreas = new FormControl('');
  searchMov = new FormControl('');

  // Movimientos
  movements: Movement[] = [];
  kpiIngresos = 0;
  kpiEgresos = 0;
  kpiSaldo = 0;

  displayedTreColumns = ['name','ingresos','egresos'];
  displayedMovColumns = ['index','date','concept','category','amount','actions'];

  tabIndex = 0; // 0=Movimientos

  constructor(private fin: FinanzasService, private dialog: MatDialog, private router: Router) {}

  ngOnInit(): void {
    this.fin.treasuries$.subscribe(list => this.treasuries = list);
    this.fin.selectedTreasuryId$.subscribe(() => {
      this.selected = this.fin.selectedTreasury ?? null;
      this.updateKPIs();
    });
    this.fin.movements$.subscribe(list => {
      this.movements = list;
      this.updateKPIs();
    });

    this.searchTreas.valueChanges.pipe(debounceTime(200)).subscribe(q => this.fin.filterByText(q ?? ''));
    this.searchMov.valueChanges.pipe(debounceTime(200)).subscribe(q => {
      const id = this.fin.selectedTreasury?.id;
      if (!id) return;
      const full = this.fin['movements'].filter((m: Movement) => m.treasuryId === id);
      const text = (q || '').toLowerCase();
      this.movements = text ? full.filter(m =>
        (m.concept || '').toLowerCase().includes(text) ||
        (m.category || '').toLowerCase().includes(text)
      ) : full;
      this.updateKPIs();
    });
  }

  private updateKPIs() {
    const list = this.movements;
    this.kpiIngresos = list.filter(m => m.type === 'Ingreso').reduce((a, b) => a + b.amount, 0);
    this.kpiEgresos  = list.filter(m => m.type === 'Egreso').reduce((a, b) => a + b.amount, 0);
    this.kpiSaldo    = this.kpiIngresos - this.kpiEgresos;
  }

  setStatusFilter(s: 'Inactivo' | 'Activo' | 'Todos') { this.fin.filterByStatus(s === 'Todos' ? 'Todos' : s); }

  openAddTreasury() {
    this.dialog.open(DialogAddTreasuryComponent, { width: '560px', disableClose: true });
  }

selectTreasury(t: Treasury) {
  this.fin.selectTreasury(t.id); // mantiene el estado del servicio
  this.dialog.open(DialogTreasuryDetailComponent, {
    width: '980px',
    maxWidth: '98vw',
    disableClose: true,
    data: { treasuryId: t.id }
  });
}
  openAddMovement() {
    if (!this.selected) return;
    this.dialog.open(DialogMovementComponent, {
      width: '680px',
      disableClose: true,
      data: { treasuryId: this.selected.id }
    });
  }

  deleteMovement(row: Movement) { this.fin.removeMovement(row.id); }

    regresar() {
    this.router.navigate(['/dashboard']);
  }
}

