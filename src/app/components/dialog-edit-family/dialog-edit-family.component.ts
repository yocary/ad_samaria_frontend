import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  FamiliesService,
  Family,
  FamilyMember,
  RoleFam,
  PersonaMini,
} from 'src/app/services/families.service';
import { FormControl, Validators } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
} from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import Swal from 'sweetalert2';

interface DialogData {
  family?: Family;
  familyId?: number;
}

@Component({
  selector: 'app-dialog-edit-family',
  templateUrl: './dialog-edit-family.component.html',
  styleUrls: ['./dialog-edit-family.component.scss'],
})
export class DialogEditFamilyComponent implements OnInit {
  // familia
  family!: Family;
  nameCtrl = new FormControl('', [
    Validators.required,
    Validators.maxLength(120),
  ]);
  saving = false;

  // miembros
  miembros: FamilyMember[] = [];
  roles: RoleFam[] = [];

  // campo único de personas (input + lista)
  personaQuery = new FormControl('');
  personas$: Observable<PersonaMini[]> = of([]);
  selectedPersona: PersonaMini | null = null;

  // rol (sin genéricos para evitar TS2558)
  rolCtrl = new FormControl(null);

  constructor(
    private ref: MatDialogRef<DialogEditFamilyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private families: FamiliesService
  ) {}

  ngOnInit(): void {
    if (this.data.family) {
      this.family = this.data.family;
      this.nameCtrl.setValue(this.family.nombre || '');
      this.loadAuxData();
    } else if (this.data.familyId) {
      this.families.getById(this.data.familyId).subscribe({
        next: (fam) => {
          this.family = fam;
          this.nameCtrl.setValue(fam.nombre || '');
          this.loadAuxData();
        },
        error: () => {
          Swal.fire('Error', 'No se pudo obtener la familia.', 'error');
          this.close();
        },
      });
    } else {
      Swal.fire('Aviso', 'No se recibió información de familia.', 'warning');
      this.close();
    }
  }

  private loadAuxData() {
    this.cargarMiembros();
    this.cargarRoles();

    // stream de búsqueda: mínimo 2 letras, si no, lista vacía
    this.personas$ = this.personaQuery.valueChanges.pipe(
      debounceTime(250),
      map((v) => (v || '').toString().trim()),
      distinctUntilChanged(),
      switchMap((q) =>
        q.length < 2 ? of([]) : this.families.buscarPersonas(q)
      )
    );
  }

  // ===== Familia =====
  guardarNombre() {
    if (this.nameCtrl.invalid) {
      this.nameCtrl.markAsTouched();
      Swal.fire(
        'Validación',
        'El nombre de familia es requerido (máx. 120).',
        'warning'
      );
      return;
    }
    const nuevo = (this.nameCtrl.value || '').toString().trim();
    if (!nuevo) {
      Swal.fire(
        'Validación',
        'El nombre de familia no puede estar vacío.',
        'warning'
      );
      return;
    }

    this.saving = true;
    this.families.actualizarFamilia(this.family.id, nuevo).subscribe({
      next: (fam) => {
        this.family = fam;
        this.nameCtrl.setValue(fam.nombre);
        this.saving = false;
        Swal.fire('Listo', 'Nombre de familia actualizado.', 'success');
      },
      error: () => {
        this.saving = false;
        Swal.fire('Error', 'No se pudo actualizar el nombre.', 'error');
      },
    });
    window.location.reload();
  }

  // ===== Miembros =====
  cargarMiembros() {
    this.families.listarMiembros(this.family.id).subscribe({
      next: (list) => (this.miembros = list),
      error: () =>
        Swal.fire('Error', 'No se pudieron cargar los miembros.', 'error'),
    });
  }

  cargarRoles() {
    this.families.listarRoles().subscribe({
      next: (list) => (this.roles = list),
      error: () =>
        Swal.fire('Error', 'No se pudieron cargar los roles.', 'error'),
    });
  }

  // selección desde la lista
  seleccionarPersona(p: PersonaMini) {
    this.selectedPersona = p;
    this.personaQuery.setValue(p.nombre, { emitEvent: false }); // mostrar nombre sin re-disparar búsqueda
  }

  displayPersona = (p?: PersonaMini) => (p ? p.nombre : '');

  limpiarSeleccionPersona() {
    this.selectedPersona = null;
    this.personaQuery.setValue('');
  }

  agregarMiembro() {
    if (!this.selectedPersona) {
      Swal.fire(
        'Validación',
        'Selecciona un miembro desde el buscador.',
        'warning'
      );
      return;
    }
    if (!this.rolCtrl.value) {
      Swal.fire('Validación', 'Selecciona un rol.', 'warning');
      return;
    }

    this.families
      .agregarMiembro(
        this.family.id,
        this.selectedPersona.id,
        this.rolCtrl.value
      )
      .subscribe({
        next: () => {
          this.selectedPersona = null;
          this.personaQuery.setValue('');
          this.rolCtrl.reset();
          this.cargarMiembros();
          Swal.fire('Listo', 'Miembro agregado a la familia.', 'success');
        },
        error: (err) => {
          const status = err?.status;
          const msg: string = err?.error?.message || err?.error || '';
          if (
            status === 409 ||
            (typeof msg === 'string' &&
              msg.toLowerCase().includes('ya pertenece'))
          ) {
            Swal.fire(
              'Duplicado',
              'La persona ya pertenece a esta familia con ese rol.',
              'info'
            );
          } else {
            Swal.fire('Error', 'No se pudo agregar el miembro.', 'error');
          }
        },
      });
  }

  quitarMiembro(familiaPersonaId: number) {
    Swal.fire({
      title: 'Confirmar',
      text: '¿Quitar este miembro de la familia?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar',
    }).then((res) => {
      if (!res.isConfirmed) return;

      this.families.eliminarMiembro(familiaPersonaId).subscribe({
        next: () => {
          this.cargarMiembros();
          Swal.fire('Listo', 'Miembro quitado.', 'success');
        },
        error: () =>
          Swal.fire('Error', 'No se pudo quitar el miembro.', 'error'),
      });
    });
  }

  close(ok = false) {
    this.ref.close(ok);
  }
}
