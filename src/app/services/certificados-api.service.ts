import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface CertificadoDTO {
  id: number;
  miembro: string;
  tipo: string;
  fecha: string; // ISO
}

export interface CrearCertificadoMembresiaRequest {
  nombreMiembro: string;
  fecha: string; // yyyy-MM-dd
}


@Injectable({ providedIn: 'root' })
export class CertificadosApiService {
  private api = `${(environment as any).apiUrl || (environment as any).api}/certificado`;

  constructor(private http: HttpClient) {}

  // LISTAR
  listar(q?: string): Observable<CertificadoDTO[]> {
    const params = q ? new HttpParams().set('q', q) : undefined;
    return this.http.get<CertificadoDTO[]>(this.api, { params });
  }

  // CREAR (tu endpoint existente)
  crearMembresiaCertificado(req: CrearCertificadoMembresiaRequest): Observable<any> {
    return this.http.post(`${this.api}/membresia/crear`, req);
  }

  generarMembresiaPdf(req: CrearCertificadoMembresiaRequest): Observable<Blob> {
    return this.http.post(`${this.api}/membresia/pdf`, req, { responseType: 'blob' });
  }

  // ELIMINAR
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  // DESCARGAR PDF POR ID (recomendado si tienes /certificados/{id}/pdf)
  descargarPorId(id: number): Observable<Blob> {
    return this.http.get(`${this.api}/${id}/pdf`, { responseType: 'blob' });
  }

  // ALTERNATIVA: generar pasando el tipo por ruta (si no tienes /{id}/pdf)
  //  POST /certificados/generar/{tipo} con el payload requerido por la plantilla
  generarPorTipo(tipo: string, payload: any): Observable<Blob> {
    return this.http.post(`${this.api}/generar/${encodeURIComponent(tipo)}`, payload, {
      responseType: 'blob'
    });
  }

  descargarPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.api}/${id}/pdf`, { responseType: 'blob' });
  }

  delete(id: number) {
  return this.http.delete<void>(`${this.api}/${id}`);
}
}
