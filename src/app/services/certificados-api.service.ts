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
  fecha: string; 
}

export interface CrearBautismoRequest {
  nombreMiembro: string; 
  fechaBautismo: string; 
  fechaExpedicion: string; 
}

export interface CrearNinosRequest {
  nombreMiembro: string;
  nombrePadre: string;
  nombreMadre: string;
  lugarFechaNacimiento: string; 
  fechaExpedicion: string; 
}

export interface CrearMatrimonioRequest {
  esposo: string;
  esposa: string;
  fechaExpedicion: string; 
}

@Injectable({ providedIn: 'root' })
export class CertificadosApiService {
  private api = `${
    (environment as any).apiUrl || (environment as any).api
  }/certificado`;

  constructor(private http: HttpClient) {}

  listar(q?: string): Observable<CertificadoDTO[]> {
    const params = q ? new HttpParams().set('q', q) : undefined;
    return this.http.get<CertificadoDTO[]>(this.api, { params });
  }

  crearMembresiaCertificado(
    req: CrearCertificadoMembresiaRequest
  ): Observable<any> {
    return this.http.post(`${this.api}/membresia/crear`, req);
  }

  generarMembresiaPdf(req: CrearCertificadoMembresiaRequest): Observable<Blob> {
    return this.http.post(`${this.api}/membresia/pdf`, req, {
      responseType: 'blob',
    });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  descargarPorId(id: number): Observable<Blob> {
    return this.http.get(`${this.api}/${id}/pdf`, { responseType: 'blob' });
  }

  generarPorTipo(tipo: string, payload: any): Observable<Blob> {
    return this.http.post(
      `${this.api}/generar/${encodeURIComponent(tipo)}`,
      payload,
      {
        responseType: 'blob',
      }
    );
  }

  descargarPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.api}/${id}/pdf`, { responseType: 'blob' });
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  crearBautismo(req: CrearBautismoRequest): Observable<any> {
    return this.http.post(`${this.api}/bautismo/crear`, req);
  }

  pdfBautismo(req: CrearBautismoRequest): Observable<Blob> {
    return this.http.post(`${this.api}/bautismo/pdf`, req, {
      responseType: 'blob',
    });
  }

  crearNinos(req: CrearNinosRequest): Observable<any> {
    return this.http.post(`${this.api}/ninos/crear`, req);
  }

  generarPdfNinos(req: CrearNinosRequest): Observable<Blob> {
    return this.http.post(`${this.api}/ninos/pdf`, req, {
      responseType: 'blob',
    });
  }

  crearMatrimonio(req: CrearMatrimonioRequest) {
    return this.http.post(`${this.api}/matrimonio/crear`, req);
  }

  generarPdfMatrimonio(req: CrearMatrimonioRequest): Observable<Blob> {
    return this.http.post(`${this.api}/matrimonio/pdf`, req, {
      responseType: 'blob',
    });
  }
}
