import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

declare let gtag: Function;

@Injectable({ providedIn: 'root' })
export class AnalyticsService {

  constructor(private router: Router) {
    this.trackPageViews();
  }

  private trackPageViews() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        gtag('config', 'G-FCB0DQCB0R', { page_path: event.urlAfterRedirects });
      }
    });
  }

  // Evento personalizado
  public sendEvent(name: string, params?: any) {
    gtag('event', name, params);
  }
}
