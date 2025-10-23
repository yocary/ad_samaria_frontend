export interface EventoItem {
  id: number;
  nombre: string;
  fecha: string;          // ISO o 'dd/MM/yyyy' según devuelvas
  asistencias: number;
  visitantes: number;
  total: number;          // asistencias + visitantes (o el que envíes)
}

export interface EventoNewPayload {
  nombre: string;
  fecha: string;          // 'yyyy-MM-dd'
  descripcion?: string;
}
