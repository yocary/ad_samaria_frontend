import { TestBed } from '@angular/core/testing';

import { AnalyticsInterceptor } from './analytics.interceptor';

describe('AnalyticsInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      AnalyticsInterceptor
      ]
  }));

  it('should be created', () => {
    const interceptor: AnalyticsInterceptor = TestBed.inject(AnalyticsInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
