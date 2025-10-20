import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, switchMap, startWith } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import Swal from 'sweetalert2';

// Servicios (ajusta rutas si difieren en tu proyecto)
import { MiembrosService } from 'src/app/services/miembros.service';
import { RolesSistemaService } from 'src/app/services/roles-sistema.service';
import { PersonaRolService } from 'src/app/services/persona-rol.service';

// Tipos locales "seguros" (evitamos genéricos en FormControl)
interface PersonaMini {
  id: number;
  nombre: string;
}
interface RolSistemaItem {
  id: number;
  nombre: string;
}
interface PersonaRolDTO {
  id: number;         // id de la asignación
  personaId: number;
  rolId: number;
  rolNombre: string;
  desde?: string | null;
  hasta?: string | null;
}

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit {
  // --------- Estado UI ---------
  saving = false;

  // --------- Autocomplete Personas ---------
  personaQuery = new FormControl('');                // input de búsqueda
  personas$: Observable<PersonaMini[]> = of([]);     // resultados
  personaSeleccionada: PersonaMini | null = null;    // selección actual

  // --------- Roles del backend ---------
  roles: RolSistemaItem[] = [];
  rolCtrl = new FormControl(null, Validators.required); // id del rol

  // --------- Roles asignados a la persona seleccionada ---------
  rolesAsignados: PersonaRolDTO[] = [];

  // Form "contenedor" para validación mínima (sin genéricos)
  form: FormGroup = this.fb.group({
    personaId: [null, Validators.required],
    rolId: [null, Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private miembrosSvc: MiembrosService,
    private rolSvc: RolesSistemaService,
    private personaRolSvc: PersonaRolService
  ) {}

  ngOnInit(): void {
    // Cargar catálogo de roles
    this.rolSvc.listar().subscribe({
      next: (list: any) => this.roles = Array.isArray(list) ? list : [],
      error: () => {
        this.roles = [];
        Swal.fire('Error', 'No se pudieron cargar los roles.', 'error');
      }
    });

    // Autocomplete de Personas
    this.personas$ = this.personaQuery.valueChanges.pipe(
      startWith(''),
      debounceTime(250),
      map((v: any) => (v || '').toString().trim()),
      distinctUntilChanged(),
      switchMap((q: string) => q.length < 2 ? of([]) : this.miembrosSvc.buscarMin$(q))
    );

    // Sincronizar el form con el control rolCtrl
    this.rolCtrl.valueChanges.subscribe((id: any) => {
      this.form.get('rolId')?.setValue(id);
    });
  }

  // ---------- Selección de persona ----------
  seleccionarPersona(p: PersonaMini) {
    this.personaSeleccionada = p;
    this.personaQuery.setValue(p.nombre, { emitEvent: false });
    this.form.get('personaId')?.setValue(p.id);
    this.cargarRolesAsignados(p.id);
  }

  limpiarPersona() {
    this.personaSeleccionada = null;
    this.personaQuery.setValue('');
    this.form.get('personaId')?.reset();
    this.rolesAsignados = [];
  }

  private cargarRolesAsignados(personaId: number) {
    this.personaRolSvc.listarPorPersona(personaId).subscribe({
      next: (list: any) => this.rolesAsignados = Array.isArray(list) ? list : [],
      error: () => {
        this.rolesAsignados = [];
        Swal.fire('Error', 'No se pudieron cargar los roles asignados.', 'error');
      }
    });
  }

  // ---------- Acción: Agregar rol ----------
  agregar(): void {
    if (!this.personaSeleccionada) {
      Swal.fire('Validación', 'Selecciona una persona.', 'warning');
      return;
    }
    if (this.rolCtrl.invalid || !this.rolCtrl.value) {
      Swal.fire('Validación', 'Selecciona un rol.', 'warning');
      return;
    }

    const personaId = this.personaSeleccionada.id;
    const rolId = Number(this.rolCtrl.value);

    this.saving = true;
    this.personaRolSvc.asignar(personaId, rolId).subscribe({
      next: () => {
        this.saving = false;
        Swal.fire('Listo', 'Rol asignado correctamente.', 'success');
        this.cargarRolesAsignados(personaId);
        this.rolCtrl.reset();
        this.form.get('rolId')?.reset();
      },
      error: (err) => {
        this.saving = false;
        if (err?.status === 409) {
          Swal.fire('Duplicado', 'La persona ya tiene ese rol activo.', 'info');
        } else {
          Swal.fire('Error', 'No se pudo asignar el rol.', 'error');
        }
      }
    });
  }

  // ---------- Acción: Quitar rol ----------
  quitarRol(asignacionId: number) {
    if (!this.personaSeleccionada) return;

    Swal.fire({
      title: 'Quitar rol',
      text: '¿Seguro que deseas quitar este rol?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    }).then(res => {
      if (!res.isConfirmed) return;

      this.personaRolSvc.quitar(asignacionId).subscribe({
        next: () => {
          Swal.fire('Listo', 'Rol quitado.', 'success');
          this.cargarRolesAsignados(this.personaSeleccionada!.id);
        },
        error: () => Swal.fire('Error', 'No se pudo quitar el rol.', 'error')
      });
    });
  }

  // ---------- Navegación ----------
  regresar() {
    this.router.navigate(['/roles/home']);
  }

  // ---------- Helpers UI ----------
  displayPersona(p?: PersonaMini) { return p ? p.nombre : ''; }
}
