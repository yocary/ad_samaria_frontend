// src/app/services/miembros.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { PersonaMini } from './personas.service';

export interface OpcionCatalogo {
  id: number;
  nombre: string;
}

export interface CrearMiembroRequest {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  telefono?: string;
  direccion?: string;

  sexoId: number;
  estadoCivilId: number;
  clasificacionId: number;
  tipoPersonaId: number;

  fechaNacimiento: string; // 'yyyy-MM-dd'
}

/** ----- NUEVO: DTO de la ficha ----- **/
export interface FichaFamilia {
  id: number;
  familiaNombre: string;
  rolFamiliar: string;
}

export interface FichaLiderazgo {
  liderazgoId: number;
  liderazgo: string;
  rol: string;
  desde?: string; // dd/MM/yyyy (o vacío)
  hasta?: string; // dd/MM/yyyy (o vacío)
}

export interface FichaCertificado {
  id: number;
  tipo: string;
  fecha: string; // dd/MM/yyyy
}

export interface FichaGrupo {
  id: number;
  nombre: string;
}

export interface PersonaFicha {
  id: number;
  nombreCompleto: string;

  telefono?: string;
  direccion?: string;

  fechaNacimiento?: string; // dd/MM/yyyy
  edad?: number;

  sexo?: string;
  estadoCivil?: string;
  clasificacion?: string;
  tipoPersona?: string;
  estatus?: string;
  ministerio?: string;

  familias: FichaFamilia[];
  liderazgos: FichaLiderazgo[];
  certificados: FichaCertificado[];
  grupos: FichaGrupo[];
}

@Injectable({ providedIn: 'root' })
export class MiembrosService {
  private base = `${environment.api}/persona`;

  constructor(private http: HttpClient) {}

  // catálogos existentes...
  getSexos() { return this.http.get<OpcionCatalogo[]>(`${this.base}/sexos`); }
  getEstadosCiviles() { return this.http.get<OpcionCatalogo[]>(`${this.base}/estados-civiles`); }
  getClasificaciones() { return this.http.get<OpcionCatalogo[]>(`${this.base}/clasificaciones`); }
  getTiposPersona() { return this.http.get<OpcionCatalogo[]>(`${this.base}/tipos-persona`); }

  crearMiembroForm(payload: CrearMiembroRequest) {
    return this.http.post(`${this.base}/form`, payload);
  }

  /** ----- NUEVO: obtener ficha por personaId ----- **/
  getFicha(personaId: number): Observable<PersonaFicha> {
    return this.http.get<PersonaFicha>(`${this.base}/${personaId}/ficha`);
  }

  buscarMin$(q: string) {
  return this.http.get<PersonaMini[]>(`${this.base}/buscar`, { params: { q } });
}

}

