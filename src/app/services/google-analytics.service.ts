import { Injectable } from '@angular/core';

declare var gtag: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleAnalyticsService {

  constructor() { }

  sendPageView(url: string) {
    gtag('event', 'page_view', {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title
    });
  }

}
