import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export interface OpcionCatalogo {
  id: number; // en BD pueden ser smallint/short, en TS usamos number
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

@Injectable({ providedIn: 'root' })
export class MiembrosService {
  // si tienes environment.apiUrl, reemplaza '' por environment.apiUrl
  private base = `${environment.api}/persona`;

  constructor(private http: HttpClient) {}

  // catálogos
  getSexos() {
    return this.http.get<OpcionCatalogo[]>(`${this.base}/sexos`);
  }
  getEstadosCiviles() {
    return this.http.get<OpcionCatalogo[]>(`${this.base}/estados-civiles`);
  }
  getClasificaciones() {
    return this.http.get<OpcionCatalogo[]>(`${this.base}/clasificaciones`);
  }
  getTiposPersona() {
    return this.http.get<OpcionCatalogo[]>(`${this.base}/tipos-persona`);
  }

  // crear (usa tu endpoint JSON en /persona/form)
  crearMiembroForm(payload: CrearMiembroRequest) {
    return this.http.post(`${this.base}/form`, payload);
  }
}
