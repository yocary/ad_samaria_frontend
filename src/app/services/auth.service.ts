import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
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
  roles: string[];
}

export interface CrearUsuarioRequest {
  personaId?: number;
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

  /** Emite cuando hay que cortar TODO (HTTP en curso, streams, sockets, intervals, etc.) */
  readonly logout$ = new Subject<void>();

  /** Registro de closures para limpiar recursos “vivos” (intervalos, sockets, workers, etc.) */
  private disposables: Array<() => void> = [];

  /** Timer para cerrar sesión justo antes de que expire el JWT */
  private expTimerId: any = null;

  /** Evita doble logout simultáneo (p. ej., múltiples 401) */
  private _loggingOut = false;

  constructor(private http: HttpClient, private zone: NgZone) {
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
      // Si el token existe al boot, programa su expiración
      this.startExpWatch(token);
    }
  }

  /** ==== LOGIN ==== */
  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, { username, password }).pipe(
      tap((res) => {
        // Guardar credenciales
        localStorage.setItem('token', res.token);
        localStorage.setItem('usuario', res.username);
        localStorage.setItem('roles', JSON.stringify(res.roles));
        localStorage.setItem('usuarioId', res.usuarioId.toString());

        // Estado del usuario
        this.usuarioActual$.next({
          id: res.usuarioId,
          nombre: res.username,
          roles: res.roles
        });

        // Programar watchdog de expiración
        this.startExpWatch(res.token);
      })
    );
  }

  /** ==== LOGOUT (limpia todo) ==== */
logout(opts: { hard?: boolean } = {}): void {
  if (this._loggingOut) return;
  this._loggingOut = true;

  try {
    // 1) Avisar a toda la app para cortar observables/HTTP
    this.logout$.next();

    // 2) Cerrar recursos registrados (intervalos, sockets, workers)
    for (const dispose of this.disposables) {
      try { dispose(); } catch {}
    }
    this.disposables = [];

    // 3) Limpiar storage
    localStorage.clear();
    sessionStorage.clear();

    // 4) 🧹 Limpiar caches del navegador
    if ('caches' in window) {
      caches.keys().then(keys => {
        keys.forEach(key => caches.delete(key));
      });
    }

    // 5) 🧼 Desregistrar Service Workers (si usas PWA)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then(regs => regs.forEach(r => r.unregister()))
        .catch(() => {});
    }

    // 6) Limpiar estado de usuario
    this.usuarioActual$.next(null);
  } finally {
    this._loggingOut = false;
  }
}


  /** Permite que otros servicios registren su cleanup */
  registerDisposable(dispose: () => void) {
    this.disposables.push(dispose);
  }

  /** ==== GETTERS ==== */
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
    const t = this.token;
    return !!t && !this.isTokenExpired(t);
  }

  /** ==== USUARIOS ==== */
  crearUsuario(body: CrearUsuarioRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUsuario}/crearUsuario`, body);
  }

  sugerirUsername(personaId: number): Observable<{ username: string }> {
    return this.http.get(`${this.baseUsuario}/sugerir/${personaId}`, {
      responseType: 'text'
    }).pipe(map((username: string) => ({ username })));
  }

  cambiarPassword(username: string, passwordActual: string, passwordNuevo: string): Observable<any> {
    return this.http.post(`${this.baseUsuario}/cambiar-password`, {
      username,
      passwordActual,
      passwordNuevo
    });
  }

  /** ==== JWT helpers ==== */
  isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      if (!decoded?.exp) return true;
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  /** Programa un logout automático unos segundos antes de expirar el JWT */
  private startExpWatch(token: string) {
    // limpiar timer previo
    if (this.expTimerId) {
      clearTimeout(this.expTimerId);
      this.expTimerId = null;
    }

    let expMs = 0;
    try {
      const decoded: any = jwtDecode(token);
      expMs = (decoded?.exp ?? 0) * 1000;
    } catch {
      // token inválido -> disparar logout en el siguiente tick
      this.zone.run(() => this.logout({ hard: true }));
      return;
    }

    if (!expMs) return;
    const msToExp = Math.max(expMs - Date.now(), 0);
    const fireIn = Math.max(msToExp - 2000, 0); // 2s antes

    this.zone.runOutsideAngular(() => {
      this.expTimerId = setTimeout(() => {
        this.zone.run(() => this.logout({ hard: true }));
      }, fireIn);
    });
  }
}
