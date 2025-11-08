import { Inject, Injectable, Optional } from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import {
  DateAdapter,
  MAT_DATE_LOCALE,
  NativeDateAdapter
} from '@angular/material/core';

@Injectable()
export class DDMYYYYDateAdapter extends NativeDateAdapter {
  constructor(
    @Optional() @Inject(MAT_DATE_LOCALE) matDateLocale: string,
    private platform: Platform
  ) {
    super(matDateLocale, platform);
  }

  /** Parsear strings en formato dd/MM/yyyy (también d/M/yyyy) */
  override parse(value: any): Date | null {
    if (typeof value === 'string') {
      const s = value.trim();
      const parts = s.split('/');
      if (parts.length === 3) {
        const d = Number(parts[0]);
        const m = Number(parts[1]);
        const y = Number(parts[2]);
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
          const date = new Date(y, m - 1, d);
          if (
            date &&
            date.getFullYear() === y &&
            date.getMonth() === m - 1 &&
            date.getDate() === d
          ) {
            return date;
          }
          return null;
        }
      }
      const ts = Date.parse(s);
      return Number.isNaN(ts) ? null : new Date(ts);
    }
    return value instanceof Date ? value : null;
  }

  /** Formatear siempre como dd/MM/yyyy */
  override format(date: Date, displayFormat: Object): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
}
