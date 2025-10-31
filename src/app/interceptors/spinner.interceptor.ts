import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable()
export class SpinnerInterceptor implements HttpInterceptor {
  private active = 0;

  constructor(private spinner: NgxSpinnerService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // muestra en la primera request activa
    if (this.active === 0) {
      this.spinner.show();
    }
    this.active++;

    return next.handle(req).pipe(
      finalize(() => {
        this.active = Math.max(0, this.active - 1);
        if (this.active === 0) {
          this.spinner.hide();
        }
      })
    );
  }
}
