import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';


declare var gtag: any;

@Injectable()
export class AnalyticsApiInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = Date.now();

    return next.handle(req).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            const duration = Date.now() - startTime;

            gtag('event', 'api_request', {
              api_endpoint: req.url,
              method: req.method,
              status: event.status,
              response_time_ms: duration
            });
          }
        },
        error: (error: HttpErrorResponse) => {
          const duration = Date.now() - startTime;

          gtag('event', 'api_error', {
            api_endpoint: req.url,
            method: req.method,
            status: error.status,
            response_time_ms: duration,
            error_message: error.message || 'unknown'
          });
        }
      })
    );
  }
}
