export type TreasuryStatus = 'Activo' | 'Inactivo';

export interface Movement {
  id: number;
  treasuryId: number;
  type: 'Ingreso' | 'Egreso';
  date: string;           // ISO
  concept: string;
  category?: string;
  amount: number;         // Q
  method: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Otro';
  memberName?: string;
  notes?: string;
}

/** Modelo UI que usa tu HTML */
export interface Treasury {
  id: number;
  name: string;
  status: TreasuryStatus;   // ← único y consistente
  incomes: number;
  expenses: number;
}

/** Contratos con el backend */
export interface TesoreriaCreate {
  nombre: string;
  estado: boolean; // true = Activo, false = Inactivo
}

export interface CrearTesoreriaRes {
  id: number;
  mensaje: string;
}

export interface TesoreriaRow {
  id: number;
  nombre: string;
  estado: boolean;   // backend
  ingresos: number;
  egresos: number;
}
