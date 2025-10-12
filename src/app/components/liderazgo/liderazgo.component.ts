import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { LiderazgoService, LiderazgoListado } from 'src/app/services/liderazgo.service';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { DialogMinistryMembersComponent } from './dialog-ministry-members/dialog-ministry-members.component';
import { DialogEditMinistryComponent } from './dialog-edit-ministry/dialog-edit-ministry.component';

@Component({
  selector: 'app-liderazgo',
  templateUrl: './liderazgo.component.html',
  styleUrls: ['./liderazgo.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LiderazgoComponent implements OnInit {
  ministries: LiderazgoListado[] = [];
  filtered: LiderazgoListado[] = [];

  search = new FormControl('');
  newMinistry = new FormControl('');

  constructor(private svc: LiderazgoService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.load();
    this.search.valueChanges.pipe(debounceTime(150)).subscribe(() => this.applyFilter());
  }

  load() {
    this.svc.listar().subscribe(list => {
      this.ministries = list;
      this.applyFilter();
    });
  }

  private applyFilter() {
    const q = (this.search.value || '').toLowerCase().trim();
    this.filtered = q
      ? this.ministries.filter(m => m.nombre.toLowerCase().includes(q))
      : [...this.ministries];
  }

  addMinistry() {
    const nombre = (this.newMinistry.value || '').trim();
    if (!nombre) return;
    this.svc.crear(nombre).subscribe({
      next: () => { this.newMinistry.reset(); this.load(); },
      error: e => Swal.fire('Error', e?.error?.message || 'No se pudo crear', 'error')
    });
  }

openMembers(m: { id: number; nombre: string }) {
  this.dialog.open(DialogMinistryMembersComponent, {
    width: '1000px',
    maxWidth: '98vw',
    disableClose: true,
    data: { liderazgoId: m.id }
  })
  .afterClosed()
  .subscribe(() => this.load()); // refresca list
}
openEdit(m: { id: number; nombre: string }) {
  this.dialog.open(DialogEditMinistryComponent, {
    width: '640px',
    maxWidth: '96vw',
    disableClose: true,
    data: { liderazgoId: m.id, nombreActual: m.nombre }
  })
  .afterClosed()
  .subscribe(ok => { if (ok) this.load(); });
}

  remove(id: number) {
    this.svc.eliminar(id).subscribe({
      next: () => this.load(),
      error: e => Swal.fire('Error', e?.error?.message || 'No se pudo eliminar', 'error')
    });
  }
}
