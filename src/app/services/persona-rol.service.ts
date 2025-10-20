// src/app/services/persona-rol.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export interface PersonaRolDTO {
  id: number;
  rolId: number;
  rolNombre: string;
  desde?: string;
  hasta?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PersonaRolService {
  private base = `${environment.api}/persona-rol`;

  constructor(private http: HttpClient) {}

  listarPorPersona(personaId: number): Observable<PersonaRolDTO[]> {
    return this.http.get<PersonaRolDTO[]>(`${this.base}/persona/${personaId}`);
  }

  asignar(personaId: number, rolId: number) {
    return this.http.post(`${this.base}/asignar`, { personaId, rolId });
  }

  quitar(personaRolId: number) {
    return this.http.delete(`${this.base}/${personaRolId}`);
  }
}
