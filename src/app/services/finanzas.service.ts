import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CrearTesoreriaRes, Movement, TesoreriaCreate, TesoreriaRow, Treasury, TreasuryStatus } from '../models/finanzas.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { tap } from 'rxjs/operators';

export interface CrearMovimientoReq {
  tipo?: 'Ingreso' | 'Egreso';     // o usa tipoId
  tipoId?: number;
  fecha: string;                   // yyyy-MM-dd
  concepto?: string;
  cantidad: number;
  metodoPagoId: number;
  personaId?: number;
  categoriaId?: number;
  observaciones?: string;
}

export interface CategoriaMini { id: number; nombre: string; tipo: string; }

export interface MetodoPago { id: number; nombre: string; }

export interface TipoMovimientoMini { id: number; nombre: string; }



@Injectable({ providedIn: 'root' })
export class FinanzasService {
  private base = `${environment.api}/tesoreria`;

  private baseMov = `${environment.api}/movimiento`;
  
  private baseMetodoPago = `${environment.api}/metodo-pago`;
  
    private baseCategoria= `${environment.api}/categoria`;

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

  constructor(private http: HttpClient) {
    // seed
    const t1: Treasury = {
      id: this.seqT++,
      name: 'Jóvenes',
      status: 'Activo',
      incomes: 100,
      expenses: 20,
    };
    const t2: Treasury = {
      id: this.seqT++,
      name: 'Niños',
      status: 'Inactivo',
      incomes: 0,
      expenses: 0,
    };
    this.treasuries = [t1, t2];

    this.movements = [
      {
        id: this.seqM++,
        treasuryId: t1.id,
        type: 'Ingreso',
        date: new Date().toISOString(),
        concept: 'Ofrenda Jóvenes',
        category: 'Ofrenda',
        amount: 100,
        method: 'Efectivo',
        memberName: '',
        notes: '',
      },
      {
        id: this.seqM++,
        treasuryId: t1.id,
        type: 'Egreso',
        date: new Date().toISOString(),
        concept: 'Compra snacks',
        category: 'Evento',
        amount: 20,
        method: 'Efectivo',
        memberName: '',
        notes: '',
      },
    ];
    this.emit();
    this.selectTreasury(t1.id);
  }

  private emit() {
    let list = [...this.treasuries];
    if (this.statusFilter !== 'Todos')
      list = list.filter((t) => t.status === this.statusFilter);
    if (this.filterText)
      list = list.filter((t) => t.name.toLowerCase().includes(this.filterText));
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
    this.treasuries = this.treasuries.map((t) => ({
      ...t,
      incomes: map.get(t.id)!.incomes,
      expenses: map.get(t.id)!.expenses,
    }));
  }

  filterByText(q: string) {
    this.filterText = (q || '').toLowerCase();
    this.emit();
  }
  filterByStatus(s: 'Todos' | TreasuryStatus) {
    this.statusFilter = s;
    this.emit();
  }

  addTreasury(name: string, status: TreasuryStatus) {
    this.treasuries = [
      { id: this.seqT++, name, status, incomes: 0, expenses: 0 },
      ...this.treasuries,
    ];
    this.emit();
  }

  selectTreasury(id: number | null) {
    this._selectedTreasuryId$.next(id);
    const data =
      id == null ? [] : this.movements.filter((m) => m.treasuryId === id);
    this._movements$.next(data);
  }

  get selectedTreasury(): Treasury | undefined {
    const id = this._selectedTreasuryId$.value;
    return this.treasuries.find((t) => t.id === id!);
  }

  addMovement(m: Omit<Movement, 'id'>) {
    this.movements = [{ id: this.seqM++, ...m }, ...this.movements];
    this.selectTreasury(m.treasuryId);
    this.emit();
  }

  removeMovement(id: number) {
    const current = this._selectedTreasuryId$.value;
    this.movements = this.movements.filter((m) => m.id !== id);
    this.selectTreasury(current);
    this.emit();
  }

  getMovementsForTreasury(treasuryId: number): Movement[] {
    return this.movements.filter((m) => m.treasuryId === treasuryId);
  }

  crearTesoreria(payload: TesoreriaCreate): Observable<CrearTesoreriaRes> {
    return this.http.post<CrearTesoreriaRes>(
      `${this.base}/crearTesoreria`,
      payload
    );
  }

  getTesorerias(params: {
    estado?: 'activas' | 'inactivas' | 'todas';
    q?: string;
    periodo?: 'mes' | 'mes_anterior' | 'anio' | 'todos';
  }) {
    let p = new HttpParams()
      .set('estado', params.estado || 'activas')
      .set('periodo', params.periodo || 'mes');
    if (params.q) p = p.set('q', params.q);
    return this.http.get<TesoreriaRow[]>(`${this.base}/tesorerias`, {
      params: p,
    });
  }

  mapToUI(rows: TesoreriaRow[]): Treasury[] {
  return rows.map(r => ({
    id: r.id,
    name: r.nombre,
    status: r.estado ? 'Activo' : 'Inactivo', // ← conversión aquí
    incomes: r.ingresos,
    expenses: r.egresos,
  }));
}

 private movementsSub = new BehaviorSubject<Movement[]>([]);

  /**
   * Carga los movimientos de una tesorería y publica en `movements$`.
   * Backend: GET /tesoreria/tesorerias/{id}/movimientos?periodo=&q=
   */
  loadMovimientos(
    tesoreriaId: number,
    opts: { periodo?: 'mes' | 'mes_anterior' | 'anio' | 'todos'; q?: string }
  ): Observable<Movement[]> {
    let params = new HttpParams().set('periodo', opts.periodo || 'mes');
    if (opts.q && opts.q.trim()) params = params.set('q', opts.q.trim());

    return this.http
      .get<Movement[]>(`${this.base}/tesorerias/${tesoreriaId}/movimientos`, { params })
      .pipe(
        tap((list: Movement[]) => this.movementsSub.next(list)) // 👈 tip explícito
      );
  }

  /**
   * Obtiene el resumen (totales) de una tesorería.
   * Backend: GET /tesoreria/tesorerias/{id}/resumen?periodo=
   */
  getResumenTesoreria(
    tesoreriaId: number,
    periodo: 'mes' | 'mes_anterior' | 'anio' | 'todos'
  ): Observable<{ totalIngresos: number; totalEgresos: number }> {
    const params = new HttpParams().set('periodo', periodo || 'mes');
    return this.http.get<{ totalIngresos: number; totalEgresos: number }>(
      `${this.base}/tesorerias/${tesoreriaId}/resumen`,
      { params }
    );
  }

  addMovements(tesoreriaId: number, body: CrearMovimientoReq) {
    return this.http.post<{ id: number }>(
      `${this.baseMov}/tesorerias/${tesoreriaId}/movimientos`,
      body
    );
  }

  getCategoriasPorTipo(tipo: 'Ingreso'|'Egreso'): Observable<CategoriaMini[]> {
  const params = new HttpParams().set('tipo', tipo);
  return this.http.get<CategoriaMini[]>( `${this.baseMov}/categorias`, { params });
}

deleteMovement(treasuryId: number, movementId: number) {
  return this.http.delete<void>(
    `${this.baseMov}/tesorerias/${treasuryId}/movimientos/${movementId}`
  );
}

updateMovement(treasuryId: number, movementId: number, body: CrearMovimientoReq) {
  return this.http.put<void>(
    `${this.baseMov}/tesorerias/${treasuryId}/movimientos/${movementId}`,
    body
  );
}

getMetodosPago() {
  return this.http.get<MetodoPago[]>(`${this.baseMetodoPago}/metodos-pago`);
}

getTiposMovimiento() {
  return this.http.get<TipoMovimientoMini[]>(`${this.baseCategoria}/tipos-movimiento`);
}

createCategoria(body: { nombre: string; tipoMovimientoId: number }) {
  return this.http.post<CategoriaMini>(`${this.baseCategoria}/categorias`, body);
}


}
