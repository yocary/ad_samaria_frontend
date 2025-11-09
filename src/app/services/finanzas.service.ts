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

import { map } from 'rxjs/operators';

export interface CategoriaRes {
  id: number;
  nombre: string;
  tipoId: number;            // viene como Long del backend
  finanzasGenerales: boolean;
}


export interface CategoriaUI {
  id: number;
  name: string;
  typeId: number;            // numeric (1=Ingreso, 2=Egreso)
  typeName: 'Ingreso' | 'Egreso';
  finanzasGenerales: boolean;

  // campos temporales para edición inline
  editing?: boolean;
  _name?: string;
  _typeId?: number;
  _finanzasGenerales?: boolean;
}


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

export interface MovimientoGeneralDTO {
  tesoreriaId: number;
  tesoreria: string;
  categoriaId: number;
  categoria: string;
  tipo: 'Ingreso' | 'Egreso';
  amount?: number; // opcional, por si lo agregas después
}

export interface MovimientoGeneralUI {
  treasuryId: number;
  treasury: string;
  categoryId: number;
  category: string;
  type: 'Ingreso' | 'Egreso';
  amount?: number;
}

export interface TotalesGenerales {
  ingresos: number;
  egresos: number;
}


export interface CategoriaMini {
  id: number;
  nombre: string;
  tipo: string;
  finanzasGenerales: boolean;
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
  personaId: number;              
  nombre: string;                 // devuelto por el backend para mostrar
  cantidad: number;
  fecha: string;                  // yyyy-MM-dd
  tipo: 'Ingreso' | 'Egreso';
}

export interface CrearDiezmoReq {
  tipo: 'Ingreso' | 'Egreso';
  personaId: number;       
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
    private baseReport = `${environment.api}/reportes`;

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
  tipo: 'Ingreso' | 'Egreso',
  tesoreriaId: number
): Observable<CategoriaMini[]> {
  const params = new HttpParams()
    .set('tipo', tipo)
    .set('tesoreriaId', String(tesoreriaId));

  return this.http
    .get<any[]>(`${this.baseCategoria}/categorias`, { params })
    .pipe(
      map((arr: any[]) => (arr || []).map(c => this.normInCategoria(c)))
    );
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

createCategoria(body: { nombre: string; tipoMovimientoId: number; finanzasGenerales: boolean }) {
  const out = this.normOutCategoria(body);
  // console.log('[CREATE CAT] payload ->', out);
  return this.http.post<any>(`${this.baseCategoria}/categorias`, out).pipe(
    // tap(res => console.log('[CREATE CAT] res ->', res)),
    map(res => this.normInCategoria(res))
  );
}

updateCategoria(
  id: number,
  body: { nombre: string; tipoMovimientoId: number; finanzasGenerales: boolean }
) {
  const out = this.normOutCategoria(body);
  // console.log('[UPDATE CAT] payload ->', out);
  return this.http.put<any>(`${this.baseCategoria}/categorias/${id}`, out).pipe(
    // tap(res => console.log('[UPDATE CAT] res ->', res)),
    map(res => this.normInCategoria(res))
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

  downloadFinanzasPdf(tesoreriaId: number, mesISO: string) {
  // mesISO: "2025-10"
  const url = `${this.baseReport}/finanzas/tesorerias/${tesoreriaId}`;
  return this.http.get(url, {
    params: new HttpParams().set('mes', mesISO),
    responseType: 'blob'
  });
}

  downloadFinanzasPdfTodas(mesISO: string) {
  // mesISO: "2025-10"
  const url = `${this.baseReport}/finanzas/tesoreriasTodas`;
  return this.http.get(url, {
    params: new HttpParams().set('mes', mesISO),
    responseType: 'blob'
  });
}

// Helper: normaliza salida hacia backend (camel -> snake)
private normOutCategoria(dto: { nombre: string; tipoMovimientoId: number; finanzasGenerales?: boolean }) {
  return {
    nombre: dto.nombre,
    tipoMovimientoId: dto.tipoMovimientoId,
    // siempre enviar snake_case
    finanzas_generales: dto.finanzasGenerales ?? false
  };
}

// Helper: normaliza entrada desde backend (snake/camel -> camel)
private normInCategoria(res: any): CategoriaMini {
  return {
    id: res.id,
    nombre: res.nombre,
    tipo: res.tipo,
    finanzasGenerales: Boolean(res.finanzasGenerales ?? res.finanzas_generales ?? false)
  };
}

getMovimientosGenerales(params: { periodo?: 'mes'|'mes_anterior'|'anio'|'todos'; q?: string; mes?: string }) {
  let p = new HttpParams().set('periodo', params.periodo || 'mes');
  if (params.q && params.q.trim()) p = p.set('q', params.q.trim());
  if (params.mes) p = p.set('mes', params.mes); // <<--- NUEVO

  return this.http.get<any>(`${this.baseMov}/movimientos-generales`, { params: p }).pipe(
    map((resp: any) => {
      // ... (tu mapeo tal cual)
      // NO CAMBIES el resto
      if (resp && Array.isArray(resp.items)) {
        const items = resp.items.map((x: any) => ({
          treasuryId: x.tesoreriaId ?? x.treasuryId ?? x.tesoreria_id,
          treasury:   x.tesoreria   ?? x.treasury   ?? x.tesoreria_nombre ?? x.tesoreriaName,
          categoryId: x.categoriaId ?? x.categoryId ?? x.categoria_id,
          category:   x.categoria   ?? x.category   ?? x.categoria_nombre ?? x.categoriaName,
          type:       (x.tipo ?? x.type) as ('Ingreso'|'Egreso'),
          fecha:      x.fecha ?? x.date,
          amount:     x.amount ?? x.monto ?? x.cantidad
        }));
        const totales = resp.totales
          ? { ingresos: Number(resp.totales.ingresos ?? 0), egresos: Number(resp.totales.egresos ?? 0) }
          : null;
        return { items, totales };
      }
      if (Array.isArray(resp)) {
        const items = resp.map((x: any) => ({
          treasuryId: x.tesoreriaId ?? x.treasuryId ?? x.tesoreria_id,
          treasury:   x.tesoreria   ?? x.treasury   ?? x.tesoreria_nombre ?? x.tesoreriaName,
          categoryId: x.categoriaId ?? x.categoryId ?? x.categoria_id,
          category:   x.categoria   ?? x.category   ?? x.categoria_nombre ?? x.categoriaName,
          type:       (x.tipo ?? x.type) as ('Ingreso'|'Egreso'),
          amount:     x.amount ?? x.monto ?? x.cantidad
        }));
        const ingresos = items.reduce((a, r) => a + (r.type === 'Ingreso' ? (r.amount ?? 0) : 0), 0);
        const egresos  = items.reduce((a, r) => a + (r.type === 'Egreso'  ? (r.amount ?? 0) : 0), 0);
        return { items, totales: { ingresos, egresos } };
      }
      return { items: [], totales: { ingresos: 0, egresos: 0 } };
    })
  );
}

// Traduce CategoriaRes (API) -> CategoriaUI (UI)
private catResToUI = (res: CategoriaRes, tipos: TipoMovimientoMini[]): CategoriaUI => {
  const tm = tipos.find(t => t.id === res.tipoId);
  const typeName = (tm?.nombre === 'Ingreso' ? 'Ingreso' : 'Egreso') as ('Ingreso'|'Egreso');
  return {
    id: res.id,
    name: res.nombre,
    typeId: res.tipoId,
    typeName,
    finanzasGenerales: !!res.finanzasGenerales,
  };
};

// Traduce UI -> payload API (crear/actualizar)
private catUIToOut = (dto: { nombre: string; tipoId: number; finanzasGenerales?: boolean; tesoreriaId: number }) => ({
  nombre: dto.nombre,
  tipoId: dto.tipoId,
  finanzasGenerales: dto.finanzasGenerales ?? false,
  tesoreriaId: dto.tesoreriaId
});


// GET /categoria/por-tesoreria?tesoreriaId=&tipoId=
getCategoriasPorTesoreria(tesoreriaId: number, tipoId: number) {
  const params = new HttpParams()
    .set('tesoreriaId', String(tesoreriaId))
    .set('tipoId', String(tipoId));
  return this.http.get<CategoriaRes[]>(`${this.baseCategoria}/por-tesoreria`, { params });
}

// POST /categoria/categorias  (body: { nombre, tipoId, finanzasGenerales, tesoreriaId })
createCategoriaLocal(tesoreriaId: number, body: { nombre: string; tipoId: number; finanzasGenerales: boolean }) {
  const payload = this.catUIToOut({ ...body, tesoreriaId });
  return this.http.post<CategoriaRes>(`${this.baseCategoria}/categorias`, payload);
}

// PUT /categoria/categorias/{id}
updateCategoriaLocal(id: number, body: { nombre: string; tipoId: number; finanzasGenerales: boolean; tesoreriaId: number }) {
  const payload = this.catUIToOut(body);
  return this.http.put<CategoriaRes>(`${this.baseCategoria}/categorias/${id}`, payload);
}




}
