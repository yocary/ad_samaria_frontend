import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface FamilyMember {
  id: number;
  name: string;
  role: string;
}

export interface Family {
  id: number;
  name: string;
  members: FamilyMember[];
}

@Injectable({ providedIn: 'root' })
export class FamiliesService {
  private data: Family[] = [];
  private seq = 1;

  private _list$ = new BehaviorSubject<Family[]>([]);
  families$ = this._list$.asObservable();

  private lastFilter = '';

  constructor() {
    // Seed de ejemplo
    this.data = [
      {
        id: this.seq++,
        name: 'Familia Pérez',
        members: [
          { id: 11, name: 'Juan Pérez', role: 'Padre' },
          { id: 12, name: 'Ana López', role: 'Madre' },
        ]
      }
    ];
    this.emit();
  }

  private emit() {
    const list = this.lastFilter
      ? this.data.filter(f => f.name.toLowerCase().includes(this.lastFilter))
      : this.data;
    this._list$.next([...list]);
  }

  filter(q: string) {
    this.lastFilter = (q || '').toLowerCase();
    this.emit();
  }

  addFamily(name: string) {
    this.data = [{ id: this.seq++, name, members: [] }, ...this.data];
    this.emit();
  }

  removeFamily(id: number) {
    this.data = this.data.filter(f => f.id !== id);
    this.emit();
  }

  getById(id: number) {
    return this.data.find(f => f.id === id);
  }

  removeMember(familyId: number, memberId: number) {
    const fam = this.getById(familyId);
    if (!fam) return;
    fam.members = fam.members.filter(m => m.id !== memberId);
    this.emit();
  }
}
