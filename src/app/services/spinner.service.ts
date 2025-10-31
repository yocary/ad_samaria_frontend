import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SpinnerService {
  private _counter = 0;
  private _visible$ = new BehaviorSubject<boolean>(false);
  readonly loading$ = this._visible$.asObservable().pipe(distinctUntilChanged());

  private showTimer: any = null;
  private hideTimer: any = null;

  show(): void {
    this._counter++;
    // si ya está visible o hay un timer de show en curso, no dupliques
    if (this._visible$.value || this.showTimer) return;

    clearTimeout(this.hideTimer);
    this.showTimer = setTimeout(() => {
      this._visible$.next(true);
      this.showTimer = null;
    }, 50); // retardo mínimo para evitar “flash”
  }

  hide(): void {
    // protege contra desbalances
    this._counter = Math.max(0, this._counter - 1);
    if (this._counter > 0) return;

    clearTimeout(this.showTimer);
    this.showTimer = null;

    // pequeña espera para evitar parpadeo entre múltiples requests
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => {
      if (this._counter === 0) this._visible$.next(false);
      this.hideTimer = null;
    }, 150);
  }

  reset(): void {
    this._counter = 0;
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);
    this.showTimer = this.hideTimer = null;
    this._visible$.next(false);
  }
}
