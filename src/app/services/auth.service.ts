import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { jwtDecode } from 'jwt-decode';

export interface AuthResponse {
  token: string;
  usuarioId: number;
  personaId: number;
  username: string;
  roles: string[];
}

export interface UsuarioActual {
  id: number;
  nombre: string;
  roles: string[]; // <-- array de roles
}

export interface CrearUsuarioRequest {
  personaId?: number;
  dpi?: string;
  password: string;
  username?: string;
}

export interface UsernameSugeridoResponse {
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = `${environment.api}/auth`;
  private baseUsuario = `${environment.api}/usuario`;

  private usuarioActual$ = new BehaviorSubject<UsuarioActual | null>(null);

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('usuario');
    const roles = localStorage.getItem('roles');
    const usuarioId = localStorage.getItem('usuarioId');

    if (token && user && roles && usuarioId) {
      this.usuarioActual$.next({
        id: Number(usuarioId),
        nombre: user,
        roles: JSON.parse(roles)
      });
    }
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, { username, password }).pipe(
      tap((res) => {
        // Guardar token
        localStorage.setItem('token', res.token);

        // Guardar username
        localStorage.setItem('usuario', res.username);

        // Guardar todos los roles
        localStorage.setItem('roles', JSON.stringify(res.roles));

        // Guardar id de usuario
        localStorage.setItem('usuarioId', res.usuarioId.toString());

        // Actualizar estado del usuario
this.usuarioActual$.next({
  id: res.usuarioId,
  nombre: res.username,
  roles: res.roles // <-- todos los roles
});

      })
    );
  }

  logout(): void {
    localStorage.clear();
    this.usuarioActual$.next(null);
  }

  get usuario() {
    return this.usuarioActual$.asObservable();
  }

  get token(): string | null {
    return localStorage.getItem('token');
  }

  get usuarioActual(): UsuarioActual | null {
    return this.usuarioActual$.value;
  }

  get roles(): string[] {
    return JSON.parse(localStorage.getItem('roles') || '[]');
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  crearUsuario(body: CrearUsuarioRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUsuario}/crearUsuario`, body);
  }

  sugerirUsername(personaId: number): Observable<{ username: string }> {
    return this.http.get(`${this.baseUsuario}/sugerir/${personaId}`, {
      responseType: 'text'
    }).pipe(
      map((username: string) => ({ username }))
    );
  }

cambiarPassword(username: string, passwordActual: string, passwordNuevo: string): Observable<any> {
    return this.http.post(`${this.baseUsuario}/cambiar-password`, {
      username,
      passwordActual,
      passwordNuevo
    });
  }

isTokenExpired(token: string): boolean {
  try {
    const decoded: any = jwtDecode(token);
    if (!decoded?.exp) return true;
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true; // token inválido o corrupto
  }
}

}