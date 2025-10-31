import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse, HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

declare var gtag: any;

@Injectable()
export class AnalyticsInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = Date.now();

    return next.handle(req).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            const duration = Date.now() - startTime;
            this.sendEvent(req.url, req.method, event.status, duration);
          }
        },
        error: (error: HttpErrorResponse) => {
          const duration = Date.now() - startTime;
          this.sendEvent(req.url, req.method, error.status, duration);
        }
      })
    );
  }

  private sendEvent(url: string, method: string, status: number, duration: number) {
    gtag('event', 'api_call', {
      event_category: 'API',
      event_label: `${method} ${url}`,
      value: duration,
      status
    });
  }
}
