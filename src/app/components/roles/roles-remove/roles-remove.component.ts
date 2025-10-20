// src/app/components/roles-delete/roles-delete.component.ts
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, map, startWith, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import Swal from 'sweetalert2';

import { PersonaRolService, PersonaRolDTO } from 'src/app/services/persona-rol.service';
import { MiembrosService } from 'src/app/services/miembros.service';
import { Router } from '@angular/router';

interface PersonaMini {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-roles-remove',
  templateUrl: './roles-remove.component.html',
  styleUrls: ['./roles-remove.component.scss']
})
export class RolesRemoveComponent implements OnInit {
  // Autocomplete persona
  personaQuery = new FormControl('');
  personas$: Observable<PersonaMini[]> = of([]);
  personaSeleccionada: PersonaMini | null = null;

  // Roles asignados
  rolesAsignados: PersonaRolDTO[] = [];
  loading = false;

  constructor(
    private personaRolSvc: PersonaRolService,
    private miembrosSvc: MiembrosService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.personas$ = this.personaQuery.valueChanges.pipe(
      startWith(''),
      debounceTime(250),
      map(v => (v || '').toString().trim()),
      distinctUntilChanged(),
      switchMap(q => q.length < 2 ? of([]) : this.miembrosSvc.buscarMin$(q))
    );
  }

  seleccionarPersona(p: PersonaMini) {
    this.personaSeleccionada = p;
    this.personaQuery.setValue(p.nombre, { emitEvent: false });
    this.cargarRoles(p.id);
  }

  limpiarPersona() {
    this.personaSeleccionada = null;
    this.personaQuery.setValue('');
    this.rolesAsignados = [];
  }

  private cargarRoles(personaId: number) {
    this.loading = true;
    this.personaRolSvc.listarPorPersona(personaId).subscribe({
      next: list => { this.rolesAsignados = list; this.loading = false; },
      error: () => { this.rolesAsignados = []; this.loading = false; Swal.fire('Error', 'No se pudieron cargar los roles.', 'error'); }
    });
  }

  quitarRol(asignacionId: number) {
    if (!this.personaSeleccionada) return;

    Swal.fire({
      title: 'Quitar rol',
      text: '¿Seguro que deseas quitar este rol a la persona?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    }).then(res => {
      if (!res.isConfirmed) return;

      this.personaRolSvc.quitar(asignacionId).subscribe({
        next: () => {
          Swal.fire('Listo', 'Rol eliminado.', 'success');
          this.cargarRoles(this.personaSeleccionada!.id);
        },
        error: () => Swal.fire('Error', 'No se pudo eliminar el rol.', 'error')
      });
    });
  }

  displayPersona(p?: PersonaMini) { return p ? p.nombre : ''; }

    regresar() {
    this.router.navigate(['/roles/home']);
  }

}
