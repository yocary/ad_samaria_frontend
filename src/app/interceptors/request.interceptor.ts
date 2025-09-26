import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AlertUtils } from '../utils/alert-utils';

@Injectable()
export class RequestInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(catchError(err => {

      if ([401, 403].includes(err.status)) {
        this.authService.logout();
        this.router.navigate(["/login"]);
        AlertUtils.showToast(
          "error",
          `No tienes los permisos suficientes para poder realizar esta acción.`
        );
      }

      return throwError(err)
    }));
  }
}
