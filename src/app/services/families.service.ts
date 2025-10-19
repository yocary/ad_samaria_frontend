import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// ==== MODELOS ====
export interface Family {
  id: number;
  nombre: string;
}

export interface FamilyMember {
  id: number;            // id de familia_persona
  personaId: number;
  nombre: string;        // nombre completo de la persona
  rol: string;           // nombre del rol
  rolFamId: number;      // id del rol
}

export interface RoleFam {
  id: number;
  nombre: string;
}

export interface PersonaMini {
  id: number;
  nombre: string;
}

// ==== REQUESTS ====
export interface CrearFamiliaRequest { name: string; }
export interface ActualizarFamiliaRequest { name: string; }
export interface AgregarMiembroRequest { personaId: number; rolFamId: number; }

@Injectable({ providedIn: 'root' })
export class FamiliesService {
  private base = `${environment.api}/familia`;

  constructor(private http: HttpClient) {}

  // Familias
  listarFamilias(q?: string): Observable<Family[]> {
    const params = q ? new HttpParams().set('q', q) : undefined;
    return this.http.get<Family[]>(`${this.base}/listar`, { params });
  }

  crearFamilia(name: string): Observable<Family> {
    const payload: CrearFamiliaRequest = { name };
    return this.http.post<Family>(`${this.base}/crearFamilia`, payload);
  }

  actualizarFamilia(id: number, name: string): Observable<Family> {
    const payload: ActualizarFamiliaRequest = { name };
    return this.http.put<Family>(`${this.base}/actualizarNombre/${id}`, payload);
  }

  eliminarFamilia(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // Miembros de una familia
  listarMiembros(familiaId: number): Observable<FamilyMember[]> {
    return this.http.get<FamilyMember[]>(`${this.base}/${familiaId}/miembros`);
  }

  agregarMiembro(familiaId: number, personaId: number, rolFamId: number): Observable<FamilyMember> {
    const payload: AgregarMiembroRequest = { personaId, rolFamId };
    return this.http.post<FamilyMember>(`${this.base}/${familiaId}/miembros`, payload);
  }

  eliminarMiembro(familiaPersonaId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/miembros/${familiaPersonaId}`);
  }

  // Roles familiares
  listarRoles(): Observable<RoleFam[]> {
    return this.http.get<RoleFam[]>(`${this.base}/roles`);
  }

  // Personas mini (ya la tienes en backend)
  listarPersonasMini(q?: string): Observable<PersonaMini[]> {
    const params = q ? new HttpParams().set('q', q) : undefined;
    return this.http.get<PersonaMini[]>(`${environment.api}/persona/listar-todos`, { params });
  }

getById(id: number): Observable<Family> {
  return this.http.get<any>(`${this.base}/obtener/${id}`).pipe(
    map(response => ({
      id: response.id,
      nombre: response.nombre  // Mapear 'nombre' a 'name'
    }))
  );
}

buscarPersonas(q: string) {
  return this.http.get<PersonaMini[]>(
    `${environment.api}/persona/buscar`,
    { params: { q } }
  );
}


}
