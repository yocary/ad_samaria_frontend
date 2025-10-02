import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Ministry {
  id: number;
  name: string;
}

export interface Role {
  id: number;
  ministryId: number;
  name: string;
}

export interface Person {
  id: number;
  name: string;
}

export interface MinistryMember {
  id: number;
  ministryId: number;
  personId: number;
}

@Injectable({ providedIn: 'root' })
export class LiderazgoService {
  // Estado en memoria
  private _ministries = new BehaviorSubject<Ministry[]>([
    { id: 1, name: 'Alabanza' },
    { id: 2, name: 'Misiones' },
  ]);
  ministries$ = this._ministries.asObservable();

  private _roles = new BehaviorSubject<Role[]>([
    { id: 1, ministryId: 1, name: 'Presidente' },
    { id: 2, ministryId: 1, name: 'Tesorero' },
  ]);
  roles$ = this._roles.asObservable();

  private _people = new BehaviorSubject<Person[]>([
    { id: 1, name: 'Juan Pérez' },
    { id: 2, name: 'María López' },
    { id: 3, name: 'Carlos Gómez' },
  ]);
  people$ = this._people.asObservable();

  private _members = new BehaviorSubject<MinistryMember[]>([
    { id: 1, ministryId: 1, personId: 1 },
    { id: 2, ministryId: 1, personId: 2 },
  ]);
  members$ = this._members.asObservable();

  // Helpers internos
  private nextId(arr: { id: number }[]) {
    return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1;
  }

  // CRUD Ministerios
  addMinistry(name: string) {
    const cur = this._ministries.value.slice();
    cur.push({ id: this.nextId(cur), name });
    this._ministries.next(cur);
  }
  updateMinistry(id: number, name: string) {
    const cur = this._ministries.value.slice();
    const i = cur.findIndex(m => m.id === id);
    if (i >= 0) { cur[i] = { ...cur[i], name }; this._ministries.next(cur); }
  }
  removeMinistry(id: number) {
    this._ministries.next(this._ministries.value.filter(m => m.id !== id));
    this._roles.next(this._roles.value.filter(r => r.ministryId !== id));
    this._members.next(this._members.value.filter(mm => mm.ministryId !== id));
  }

  // Roles por ministerio
  addRole(ministryId: number, name: string) {
    const cur = this._roles.value.slice();
    cur.push({ id: this.nextId(cur), ministryId, name });
    this._roles.next(cur);
  }
  removeRole(roleId: number) {
    this._roles.next(this._roles.value.filter(r => r.id !== roleId));
  }
  updateRole(roleId: number, name: string) {
    const cur = this._roles.value.slice();
    const i = cur.findIndex(r => r.id === roleId);
    if (i >= 0) { cur[i] = { ...cur[i], name }; this._roles.next(cur); }
  }

  // Miembros por ministerio
  addMember(ministryId: number, personId: number) {
    const cur = this._members.value.slice();
    // evitar duplicados
    if (cur.some(m => m.ministryId === ministryId && m.personId === personId)) return;
    cur.push({ id: this.nextId(cur), ministryId, personId });
    this._members.next(cur);
  }
  removeMember(memberId: number) {
    this._members.next(this._members.value.filter(m => m.id !== memberId));
  }
}
