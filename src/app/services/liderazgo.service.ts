import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export interface LiderazgoListado {
  id: number;
  nombre: string;
  totalMiembros: number;
}

export interface LiderazgoMiembro {
  id: number;
  liderazgoId: number;
  personaId: number;
  rolId: number | null;
  desde: string | null;        // dd/MM/yyyy
  hasta: string | null;        // dd/MM/yyyy
  nombrePersona: string;
  nombreRol: string;
}

@Injectable({ providedIn: 'root' })
export class LiderazgoService {
  private base = `${environment.api}/liderazgo`;

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<LiderazgoListado[]>(`${this.base}`);
  }

  crear(nombre: string) {
    return this.http.post(`${this.base}`, { nombre });
  }

  renombrar(id: number, nombre: string) {
    return this.http.put(`${this.base}/${id}`, { nombre });
  }

  eliminar(id: number) {
    return this.http.delete(`${this.base}/${id}`);
  }

  // Roles
  listarRoles(liderazgoId: number) {
    return this.http.get<string[]>(`${this.base}/${liderazgoId}/roles`);
  }
  crearRol(liderazgoId: number, nombre: string) {
    return this.http.post(`${this.base}/${liderazgoId}/roles`, { nombre });
  }
  eliminarRol(rolId: number) {
    return this.http.delete(`${this.base}/roles/${rolId}`);
  }

  // Miembros
  listarMiembros(liderazgoId: number) {
    return this.http.get<LiderazgoMiembro[]>(`${this.base}/${liderazgoId}/miembros`);
  }
  agregarMiembro(liderazgoId: number, personaId: number, rolId: number, desde: string) {
    return this.http.post(`${this.base}/${liderazgoId}/miembros`, { personaId, rolId, desde });
  }
  desactivarMiembro(liderazgoMiembroId: number) {
    return this.http.delete(`${this.base}/miembros/${liderazgoMiembroId}`);
  }
}
