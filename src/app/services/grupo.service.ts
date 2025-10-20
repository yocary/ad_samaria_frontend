// src/app/services/grupos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export interface Tesoreria {
  id: number;
  nombre: string;
  estado: boolean;
}

export interface CrearGrupoRequest {
  nombre: string;
  estado: boolean;          // true = Activo, false = Inactivo
  tesoreriaId: number | null;
}

export interface Grupo {
  id: number;
  nombre: string;

  // Estado del grupo (tu backend suele usar boolean)
  estado?: boolean | null;

  // Algunas APIs traen el estado de tesorería como boolean...
  tesoreria?: boolean | null;

  // ...y otras sólo un id de tesorería (presencia = “activa”)
  tesoreriaId?: number | null;
}

@Injectable({ providedIn: 'root' })
export class GruposService {
  private baseGrupos = `${environment.api}/grupos`;
  private baseTes = `${environment.api}/tesorerias`;

  constructor(private http: HttpClient) {}

  listarTesorerias(): Observable<Tesoreria[]> {
    return this.http.get<Tesoreria[]>(`${this.baseTes}/listar`);
  }

  crearGrupo(payload: CrearGrupoRequest): Observable<Grupo> {
    return this.http.post<Grupo>(`${this.baseGrupos}/crear`, payload);
  }

    listar(): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(`${this.baseGrupos}/listar`);
  }
}
