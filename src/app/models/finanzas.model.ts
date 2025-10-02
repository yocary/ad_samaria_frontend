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

export interface Treasury {
  id: number;
  name: string;
  status: TreasuryStatus;
  incomes: number; 
  expenses: number; 
}
