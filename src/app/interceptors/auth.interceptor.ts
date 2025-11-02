// auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, EMPTY, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private showingAlert = false;

  constructor(private auth: AuthService, private router: Router) {}

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      if (!decoded?.exp) return true;
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  private handleExpiredSession(): Observable<never> {
    if (this.showingAlert) {
      // ya se está mostrando: solo corta la cadena de HTTP
      this.auth.logout();
      return EMPTY;
    }
    this.showingAlert = true;

    // dispara logout inmediatamente para cortar procesos/requests
    this.auth.logout();

    // mostrar alerta amigable
    void Swal.fire({
      icon: 'warning',
      title: 'Sesión expirada',
      text: 'Tu sesión ha caducado. Por favor, inicia sesión nuevamente.',
      confirmButtonText: 'Ir al login',
      confirmButtonColor: '#3085d6',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).finally(() => {
      this.showingAlert = false;
    });

    // cortar el request actual
    return EMPTY;
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.token;

    // 1) chequeo proactivo
    if (token && this.isTokenExpired(token)) {
      return this.handleExpiredSession();
    }

    // 2) clonar con Authorization si hay token válido
    const reqWithAuth = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(reqWithAuth).pipe(
      // 3) si el backend devuelve 401, tratar como sesión expirada
      catchError((err: any) => {
        if (err instanceof HttpErrorResponse && err.status === 401) {
          return this.handleExpiredSession();
        }
        return throwError(() => err);
      })
    );
  }
}
