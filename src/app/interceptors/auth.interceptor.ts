import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      if (!decoded?.exp) return true;                 // si no trae exp, trátalo como expirado
      return decoded.exp * 1000 < Date.now();         // exp viene en segundos → *1000
    } catch {
      return true;                                    // token inválido/corrupto
    }
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.token;

    if (token) {
      // ✅ check proactivo de expiración
      if (this.isTokenExpired(token)) {
        // limpia sesión si tu AuthService expone logout()
        this.auth.logout?.();

        Swal.fire({
          icon: 'warning',
          title: 'Sesión expirada',
          text: 'Tu sesión ha caducado. Por favor, inicia sesión nuevamente.',
          confirmButtonText: 'Ir al login',
          confirmButtonColor: '#3085d6'
        }).then(() => this.router.navigate(['/login']));

        return throwError(() => new Error('Token expirado'));
      }

      // 🔐 token válido → adjuntar Authorization
      const cloned = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
      return next.handle(cloned);
    }

    // sin token → continuar normal
    return next.handle(req);
  }
}
