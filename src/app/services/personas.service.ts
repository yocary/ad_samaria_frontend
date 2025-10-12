import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export interface PersonaMini {
  id: number;
  nombre: string; // concatenado en backend: nombres + apellidos
}

@Injectable({ providedIn: 'root' })
export class PersonasService {
  private base = `${environment.api}/persona`;

  constructor(private http: HttpClient) {}

  buscar(q: string): Observable<PersonaMini[]> {
    const params = new HttpParams().set('q', q);
    return this.http.get<PersonaMini[]>(`${this.base}/buscar`, { params });
  }
}
