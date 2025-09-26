import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');
    let cloned = req;

    if (token) {
      cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(cloned).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Ocurrió un error inesperado';
        switch (error.status) {
          case 400:
            errorMessage = 'Solicitud incorrecta. Verifica los datos enviados.';
            break;
          case 401:
            errorMessage = 'No autorizado. Por favor, inicia sesión.';
            break;
          case 403:
            errorMessage = 'Acceso denegado. No tienes permiso para acceder a este recurso.';
            break;
          case 404:
            errorMessage = 'Recurso no encontrado. Verifica la URL.';
            break;
          case 500:
            errorMessage = 'Error del servidor. Inténtalo más tarde.';
            break;
          case 503:
            errorMessage = 'Servicio no disponible. Inténtalo más tarde.';
            break;
          default:
            errorMessage = `Error ${error.status}: ${error.message}`;
            break;
        }
        Swal.fire({
          text: errorMessage,
          icon: 'error',
          confirmButtonColor: '#146498',
        }).then(() => {
 
        });
        return throwError(error);
      })
    );
  }
}
