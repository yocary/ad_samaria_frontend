import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy, Host } from '@angular/core';
import { MatFormField } from '@angular/material/form-field';

@Directive({
  selector: '[matOutlineFix]'   // 👈 Atributo, sin standalone
})
export class MatOutlineFixDirective implements AfterViewInit, OnDestroy {
  private ro?: ResizeObserver;
  private io?: IntersectionObserver;

  constructor(
    private host: ElementRef<HTMLElement>,
    @Host() private mf: MatFormField,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.refresh(), 0);

    if (typeof ResizeObserver !== 'undefined') {
      this.ngZone.runOutsideAngular(() => {
        this.ro = new ResizeObserver(() => this.refresh());
        this.ro.observe(this.host.nativeElement);
      });
    }

    if (typeof IntersectionObserver !== 'undefined') {
      this.ngZone.runOutsideAngular(() => {
        this.io = new IntersectionObserver((entries) => {
          if (entries.some(e => e.isIntersecting)) this.refresh();
        }, { threshold: 0.1 });
        this.io.observe(this.host.nativeElement);
      });
    }

    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('resize', this.refresh as any, { passive: true } as any);
    });
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
    this.io?.disconnect();
    window.removeEventListener('resize', this.refresh as any);
  }

  private refresh = () => {
    try {
      (this.mf as any)?._foundation?.updateOutlineGap?.();
    } catch {}
  };
}
