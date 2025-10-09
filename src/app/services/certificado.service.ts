import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type CertificateType =
  | 'Membresía'
  | 'Presentación de Niños'
  | 'Bautismo'
  | 'Matrimonio';

export interface Certificate {
  id: number;
  type: CertificateType;

  // comunes
  memberId?: number;     // miembro principal
  memberName?: string;
  pastorId?: number;
  pastorName?: string;
  issueDate?: string;    // ISO yyyy-mm-dd

  // bautismo
  baptismDate?: string;  // ISO

  // presentación de niños
  childName?: string;
  childBirthDate?: string; // ISO
  fatherId?: number; fatherName?: string; fatherIsMember?: boolean;
  motherId?: number; motherName?: string; motherIsMember?: boolean;
  witnessName?: string;

  // matrimonio
  husbandId?: number; husbandName?: string; husbandIsMember?: boolean;
  wifeId?: number; wifeName?: string; wifeIsMember?: boolean;
}

export interface Person {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class CertificadosService {
  // mock de personas y pastores
  private _people = new BehaviorSubject<Person[]>([
    { id: 1, name: 'Juan Pérez' },
    { id: 2, name: 'María López' },
    { id: 3, name: 'Carlos Gómez' },
    { id: 4, name: 'Ana Ramírez' },
    { id: 5, name: 'Pr. Daniel Soto' },
    { id: 6, name: 'Pr. Elena Cruz' },
  ]);
  people$ = this._people.asObservable();

  // certificados
  private _certs = new BehaviorSubject<Certificate[]>([]);
  certs$ = this._certs.asObservable();

  private nextId(list: { id: number }[]) {
    return list.length ? Math.max(...list.map(x => x.id)) + 1 : 1;
  }

  add(cert: Certificate) {
    const cur = this._certs.value.slice();
    cert.id = this.nextId(cur);
    cur.push(cert);
    this._certs.next(cur);
  }

  remove(id: number) {
    this._certs.next(this._certs.value.filter(c => c.id !== id));
  }

  // utilidades mock
  findPerson(id?: number) {
    return this._people.value.find(p => p.id === id);
  }
}
