import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PersonaMini } from './personas.service';

// ===== Tipos =====
export type Liderazgo = { id: number; nombre: string; };
export type Rol        = { id: number; nombre: string; };
export type PersonaLite = { id: number; nombre: string; };
export type MiembroRol = {
  id: number;
  personaId: number;
  nombrePersona: string;
  rolId: number;
  nombreRol: string;
  desde: string | null; // 'yyyy-MM-dd'
  hasta: string | null; // 'yyyy-MM-dd' | null
};

@Injectable({ providedIn: 'root' })
export class LiderazgoService {
  // ✅ Usa environment.apiUrl (tu environment ya lo define así)
  private base = environment.api;

  constructor(private http: HttpClient) {}

  // ===== Pantalla principal (CRUD liderazgo) =====
  listarLiderazgos(q?: string): Observable<Liderazgo[]> {
    const params = q ? new HttpParams().set('q', q) : undefined;
    return this.http.get<Liderazgo[]>(`${this.base}/liderazgo`, { params });
  }

  crearLiderazgo(nombre: string): Observable<Liderazgo> {
    return this.http.post<Liderazgo>(`${this.base}/liderazgo/crearLiderazgo`, { nombre });
  }

  editarLiderazgo(id: number, nombre: string): Observable<void> {
    return this.http.put<void>(`${this.base}/liderazgo/${id}`, { nombre });
  }

  eliminarLiderazgo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/liderazgo/${id}`);
  }

  // (opcional) Obtener uno
  obtenerLiderazgo(id: number): Observable<Liderazgo> {
    return this.http.get<Liderazgo>(`${this.base}/liderazgo/${id}`);
  }

  // ===== Roles por liderazgo =====
  listarRoles(liderazgoId: number): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.base}/liderazgo/${liderazgoId}/roles`);
  }

  crearRol(liderazgoId: number, nombre: string): Observable<Rol> {
    return this.http.post<Rol>(`${this.base}/liderazgo/${liderazgoId}/roles`, { nombre });
  }

  editarRol(liderazgoId: number, rolId: number, nombre: string): Observable<void> {
    return this.http.put<void>(`${this.base}/liderazgo/${liderazgoId}/roles/${rolId}`, { nombre });
  }

  eliminarRol(liderazgoId: number, rolId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/liderazgo/${liderazgoId}/roles/${rolId}`);
  }

  // ===== Miembros en un liderazgo =====
  listarMiembros(liderazgoId: number): Observable<MiembroRol[]> {
    return this.http.get<MiembroRol[]>(`${this.base}/liderazgo/${liderazgoId}/miembros`);
  }

agregarMiembro(liderazgoId: number, personaId: number, rolId: number, desdeISO?: string) {
  const body: any = { personaId, rolId };
  if (desdeISO) body.desde = desdeISO;   // solo si quieres enviar fecha
  return this.http.post(`${this.base}/liderazgo/${liderazgoId}/miembros`, body);
}

  eliminarMiembro(liderazgoId: number, miembroLidId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/liderazgo/${liderazgoId}/miembros/${miembroLidId}`);
  }

  // ===== Búsqueda de personas (módulo Miembros) =====
  // Asegúrate de tener el endpoint GET /persona/buscar?q=...
  buscarPersonas(q: string): Observable<PersonaLite[]> {
    const params = new HttpParams().set('q', q);
    return this.http.get<PersonaLite[]>(`${this.base}/persona/buscar`, { params });
  }


}
