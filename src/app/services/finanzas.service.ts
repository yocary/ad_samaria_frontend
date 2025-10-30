import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  CrearTesoreriaRes,
  Movement,
  TesoreriaCreate,
  TesoreriaRow,
  Treasury,
  TreasuryStatus,
} from '../models/finanzas.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { tap } from 'rxjs/operators';

export interface CrearMovimientoReq {
  tipo?: 'Ingreso' | 'Egreso'; // o usa tipoId
  tipoId?: number;
  fecha: string; // yyyy-MM-dd
  concepto?: string;
  cantidad: number;
  metodoPagoId: number;
  personaId?: number;
  categoriaId?: number;
  observaciones?: string;
}

export interface CategoriaMini {
  id: number;
  nombre: string;
  tipo: string;
}
export interface MetodoPago {
  id: number;
  nombre: string;
}
export interface TipoMovimientoMini {
  id: number;
  nombre: string;
}

export interface DiezmoRow {
  id: number;
  personaId: number;              // 👈 agregado: id de persona
  nombre: string;                 // devuelto por el backend para mostrar
  cantidad: number;
  fecha: string;                  // yyyy-MM-dd
  tipo: 'Ingreso' | 'Egreso';
}

export interface CrearDiezmoReq {
  tipo: 'Ingreso' | 'Egreso';
  personaId: number;              // 👈 ahora enviamos personaId
  cantidad: number;
  fecha: string;                  // yyyy-MM-dd
}

@Injectable({ providedIn: 'root' })
export class FinanzasService {
  private base = `${environment.api}/tesoreria`;
  private baseMov = `${environment.api}/movimiento`;
  private baseMetodoPago = `${environment.api}/metodo-pago`;
  private baseCategoria = `${environment.api}/categoria`;
  private baseDiez = `${environment.api}/diezmos`;

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
    // 🔇 Arranque limpio: sin datos mock
    this.treasuries = [];
    this.movements = [];
    this._treasuries$.next([]);
    this._movements$.next([]);
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
    return rows.map((r) => ({
      id: r.id,
      name: r.nombre,
      status: r.estado ? 'Activo' : 'Inactivo',
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
      .get<Movement[]>(`${this.base}/tesorerias/${tesoreriaId}/movimientos`, {
        params,
      })
      .pipe(tap((list: Movement[]) => this.movementsSub.next(list)));
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

  getCategoriasPorTipo(
    tipo: 'Ingreso' | 'Egreso'
  ): Observable<CategoriaMini[]> {
    const params = new HttpParams().set('tipo', tipo);
    return this.http.get<CategoriaMini[]>(`${this.baseMov}/categorias`, {
      params,
    });
  }

  deleteMovement(treasuryId: number, movementId: number) {
    return this.http.delete<void>(
      `${this.baseMov}/tesorerias/${treasuryId}/movimientos/${movementId}`
    );
  }

  updateMovement(
    treasuryId: number,
    movementId: number,
    body: CrearMovimientoReq
  ) {
    return this.http.put<void>(
      `${this.baseMov}/tesorerias/${treasuryId}/movimientos/${movementId}`,
      body
    );
  }

  getMetodosPago() {
    return this.http.get<MetodoPago[]>(`${this.baseMetodoPago}/metodos-pago`);
  }

  getTiposMovimiento() {
    return this.http.get<TipoMovimientoMini[]>(
      `${this.baseCategoria}/tipos-movimiento`
    );
  }

  createCategoria(body: { nombre: string; tipoMovimientoId: number }) {
    return this.http.post<CategoriaMini>(
      `${this.baseCategoria}/categorias`,
      body
    );
  }

  updateCategoria(
    id: number,
    body: { nombre: string; tipoMovimientoId: number }
  ) {
    return this.http.put<CategoriaMini>(
      `${this.baseCategoria}/categorias/${id}`,
      body
    );
  }

  deleteCategoria(id: number) {
    return this.http.delete<void>(`${this.baseCategoria}/categorias/${id}`);
  }

  updateTesoreria(id: number, body: { nombre: string; estado: boolean }) {
    return this.http.put<void>(`${this.base}/actualizarTesoreria/${id}`, body);
  }

  deleteTesoreria(id: number) {
    return this.http.delete<void>(`${this.base}/eliminarTesoreria/${id}`);
  }

   getDiezmos(params: { periodo?: 'mes'|'mes_anterior'|'anio'|'todos'; q?: string }){
    let p = new HttpParams().set('periodo', params.periodo || 'mes');
    if (params.q) p = p.set('q', params.q);
    return this.http.get<{ items: DiezmoRow[], totales: { ingresos:number; egresos:number } }>(this.baseDiez, { params: p });
  }

  createDiezmo(body: CrearDiezmoReq){
    return this.http.post<{ id:number }>(this.baseDiez, body);
  }

  updateDiezmo(id:number, body: CrearDiezmoReq){
    return this.http.put<void>(`${this.baseDiez}/${id}`, body);
  }

  deleteDiezmo(id:number){
    return this.http.delete<void>(`${this.baseDiez}/${id}`);
  }
}
