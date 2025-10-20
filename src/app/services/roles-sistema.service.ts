// src/app/services/roles-sistema.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export interface RolSistema {
  id: number;    // Short en backend, number en TS
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class RolesSistemaService {
  private base = `${environment.api}/rol-sistema`;

  constructor(private http: HttpClient) {}

  listar(): Observable<RolSistema[]> {
    return this.http.get<RolSistema[]>(`${this.base}/listar`);
  }
}
