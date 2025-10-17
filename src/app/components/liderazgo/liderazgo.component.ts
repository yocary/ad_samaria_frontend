import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { Liderazgo, LiderazgoService } from 'src/app/services/liderazgo.service';
import Swal from 'sweetalert2';
import { DialogIntegrantesComponent } from './dialog-integrantes/dialog-integrantes.component';
import { DialogEditMinistryComponent } from './dialog-edit-ministry/dialog-edit-ministry.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-liderazgo',
  templateUrl: './liderazgo.component.html',
  styleUrls: ['./liderazgo.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LiderazgoComponent implements OnInit {
  search = new FormControl('');
  nombreNuevo = new FormControl('');
  liderazgos: Liderazgo[] = [];
  filtrados: Liderazgo[] = [];

  constructor(
    private svc: LiderazgoService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.search.valueChanges
      .pipe(debounceTime(200))
      .subscribe(() => this.filtrar());
  }

  private cargar() {
    this.svc.listarLiderazgos(this.search.value || '').subscribe((list) => {
      this.liderazgos = list;
      this.filtrar();
    });
  }
  private filtrar() {
    const q = (this.search.value || '').toLowerCase().trim();
    this.filtrados = q
      ? this.liderazgos.filter((x) => x.nombre.toLowerCase().includes(q))
      : this.liderazgos.slice();
  }

  agregar() {
    const n = (this.nombreNuevo.value || '').trim();
    if (!n) return;
    this.svc.crearLiderazgo(n).subscribe({
      next: () => {
        this.nombreNuevo.reset('');
        this.cargar();
        Swal.fire('Creado', 'Ministerio creado', 'success');
      },
    });
  }

  openMembers(m: { id: number; nombre: string }) {
    this.dialog.open(DialogIntegrantesComponent, {
      width: '980px',
      maxWidth: '98vw',
      data: {
        liderazgoId: m.id,
        liderazgoNombre: m.nombre, // <-- pásalo aquí
      },
    });
  }

  editar(min: Liderazgo) {
    this.dialog
      .open(DialogEditMinistryComponent, {
        width: '560px',
        disableClose: true,
        data: { liderazgo: min },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.cargar();
      });
  }

  eliminar(min: Liderazgo) {
    Swal.fire({
      title: '¿Eliminar ministerio?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
    }).then((r) => {
      if (r.isConfirmed) {
        this.svc.eliminarLiderazgo(min.id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Ministerio eliminado', 'success');
            this.cargar();
          },
        });
      }
    });
  }

  regresarDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
