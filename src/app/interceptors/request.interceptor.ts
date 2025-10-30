import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Injectable()
export class RequestInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {

        // 🔐 Sesión expirada o sin permisos
        if (err.status === 401 || err.status === 403) {
          // Limpia sesión
          this.authService.logout?.();

          Swal.fire({
            icon: 'warning',
            title: 'Sesión expirada',
            text: 'Tu sesión ha caducado. Por favor, inicia sesión nuevamente.',
            confirmButtonText: 'Ir al login',
            confirmButtonColor: '#3085d6',
          }).then(() => {
            this.router.navigate(['/login']);
          });

          return throwError(() => err);
        }

        // (Opcional) otros errores globales
        if (err.status === 500) {
          Swal.fire({
            icon: 'error',
            title: 'Error del servidor',
            text: 'Ocurrió un problema en el servidor. Intenta más tarde.',
            confirmButtonColor: '#3085d6',
          });
        }

        return throwError(() => err);
      })
    );
  }
}
