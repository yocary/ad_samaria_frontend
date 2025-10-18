import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export interface OpcionCatalogo {
  id: number;
  nombre: string;
}

export interface CrearMiembroRequest {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  telefono?: string;
  dpi?: string;
  direccion?: string;
  sexoId: number;
  estadoCivilId: number;
  clasificacionId: number;
  tipoPersonaId: number;
  fechaNacimiento: string; // 'yyyy-MM-dd'
}

// 👉 DTO ligero para la lista del Home
export interface MiembroDTO {
  id: number;
  nombre: string; // nombre completo ya “cocinado” por el backend
}

@Injectable({ providedIn: 'root' })
export class MiembrosService {
  private base = `${environment.api}/persona`;

  constructor(private http: HttpClient) {}

  // ====== Catálogos ======
  getSexos()            { return this.http.get<OpcionCatalogo[]>(`${this.base}/sexos`); }
  getEstadosCiviles()   { return this.http.get<OpcionCatalogo[]>(`${this.base}/estados-civiles`); }
  getClasificaciones()  { return this.http.get<OpcionCatalogo[]>(`${this.base}/clasificaciones`); }
  getTiposPersona()     { return this.http.get<OpcionCatalogo[]>(`${this.base}/tipos-persona`); }

  // ====== Crear miembro (form) ======
  crearMiembroForm(payload: CrearMiembroRequest) {
    return this.http.post(`${this.base}/form`, payload);
  }

  // ====== NUEVO: Listar con filtro opcional 'q' ======
  listar(q?: string): Observable<MiembroDTO[]> {
    const params = q ? new HttpParams().set('q', q) : undefined;
    // Backend: GET /persona?q=texto  ->  [{ id, nombre }]
    return this.http.get<MiembroDTO[]>(`${this.base}`, { params });
  }

  // (Opcional) Eliminar
  eliminar(id: number) {
    // Backend: DELETE /persona/{id}
    return this.http.delete(`${this.base}/${id}`);
  }
}
