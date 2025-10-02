import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Movement, Treasury, TreasuryStatus } from '../models/finanzas.model';

@Injectable({ providedIn: 'root' })
export class FinanzasService {
  private treasuries: Treasury[] = [];
  private movements: Movement[] = [];
  private seqT = 1;
  private seqM = 1;

  private _treasuries$ = new BehaviorSubject<Treasury[]>([]);
  treasuries$ = this._treasuries$.asObservable();

  private _selectedTreasuryId$ = new BehaviorSubject<number | null>(null);
  selectedTreasuryId$ = this._selectedTreasuryId$.asObservable();

  private _movements$ = new BehaviorSubject<Movement[]>([]);
  movements$ = this._movements$.asObservable();

  private filterText = '';
  private statusFilter: 'Todos' | TreasuryStatus = 'Activo';

  constructor() {
    // seed
    const t1: Treasury = { id: this.seqT++, name: 'Jóvenes', status: 'Activo', incomes: 100, expenses: 20 };
    const t2: Treasury = { id: this.seqT++, name: 'Niños', status: 'Inactivo', incomes: 0, expenses: 0 };
    this.treasuries = [t1, t2];

    this.movements = [
      { id: this.seqM++, treasuryId: t1.id, type: 'Ingreso', date: new Date().toISOString(), concept: 'Ofrenda Jóvenes', category: 'Ofrenda', amount: 100, method: 'Efectivo', memberName: '', notes: '' },
      { id: this.seqM++, treasuryId: t1.id, type: 'Egreso',  date: new Date().toISOString(), concept: 'Compra snacks',   category: 'Evento',  amount: 20,  method: 'Efectivo', memberName: '', notes: '' },
    ];
    this.emit();
    this.selectTreasury(t1.id);
  }

  private emit() {
    let list = [...this.treasuries];
    if (this.statusFilter !== 'Todos') list = list.filter(t => t.status === this.statusFilter);
    if (this.filterText) list = list.filter(t => t.name.toLowerCase().includes(this.filterText));
    this._treasuries$.next(list);
    this.recalculateTotals();
  }

  private recalculateTotals() {
    const map = new Map<number, { incomes: number; expenses: number }>();
    for (const t of this.treasuries) map.set(t.id, { incomes: 0, expenses: 0 });
    for (const m of this.movements) {
      const agg = map.get(m.treasuryId)!;
      if (m.type === 'Ingreso') agg.incomes += m.amount;
      else agg.expenses += m.amount;
    }
    this.treasuries = this.treasuries.map(t => ({ ...t, incomes: map.get(t.id)!.incomes, expenses: map.get(t.id)!.expenses }));
  }

  filterByText(q: string) { this.filterText = (q || '').toLowerCase(); this.emit(); }
  filterByStatus(s: 'Todos' | TreasuryStatus) { this.statusFilter = s; this.emit(); }

  addTreasury(name: string, status: TreasuryStatus) {
    this.treasuries = [{ id: this.seqT++, name, status, incomes: 0, expenses: 0 }, ...this.treasuries];
    this.emit();
  }

  selectTreasury(id: number | null) {
    this._selectedTreasuryId$.next(id);
    const data = id == null ? [] : this.movements.filter(m => m.treasuryId === id);
    this._movements$.next(data);
  }

  get selectedTreasury(): Treasury | undefined {
    const id = this._selectedTreasuryId$.value;
    return this.treasuries.find(t => t.id === id!);
  }

  addMovement(m: Omit<Movement, 'id'>) {
    this.movements = [{ id: this.seqM++, ...m }, ...this.movements];
    this.selectTreasury(m.treasuryId);
    this.emit();
  }

  removeMovement(id: number) {
    const current = this._selectedTreasuryId$.value;
    this.movements = this.movements.filter(m => m.id !== id);
    this.selectTreasury(current);
    this.emit();
  }

  getMovementsForTreasury(treasuryId: number): Movement[] {
  return this.movements.filter(m => m.treasuryId === treasuryId);
}
}
