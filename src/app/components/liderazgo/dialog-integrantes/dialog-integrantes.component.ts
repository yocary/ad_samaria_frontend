import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';

import { LiderazgoService, Rol, MiembroRol } from 'src/app/services/liderazgo.service';
import { PersonasService, PersonaMini } from 'src/app/services/personas.service';
import { DialogRolComponent } from '../dialog-rol/dialog-rol.component';

@Component({
  selector: 'app-dialog-integrantes',
  templateUrl: './dialog-integrantes.component.html',
  styleUrls: ['./dialog-integrantes.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DialogIntegrantesComponent implements OnInit {
  // Encabezado (nombre del liderazgo)
  liderazgo: { id: number; nombre: string } | null = null;

  // Roles (columna izquierda)
  roles: Rol[] = [];
  rolSeleccionadoId: number | null = null;

  // Edición inline de roles
  editId: number | null = null;
  editNameCtrl = new FormControl('', { validators: [Validators.required, Validators.maxLength(60)] });

  // Miembros (columna derecha)
  miembros: MiembroRol[] = [];
  miembrosRaw: MiembroRol[] = [];
  displayedColumns = ['persona', 'accion'];
  cargando = false;

  // Combo de personas
  miembrosCombo: PersonaMini[] = [];
  personaSelCtrl: FormControl = new FormControl(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { liderazgoId: number; liderazgoNombre: string },
    private dialogRef: MatDialogRef<DialogIntegrantesComponent>,
    private lsvc: LiderazgoService,
    private personasSvc: PersonasService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.liderazgo = { id: this.data.liderazgoId, nombre: this.data.liderazgoNombre };
    this.cargarRoles();
    this.cargarMiembros();
    this.cargarMiembrosCombo(); // llena el combo de “Seleccionar un miembro”
  }

  // ---------------- Roles ----------------
  private cargarRoles(): void {
    this.lsvc.listarRoles(this.data.liderazgoId).subscribe({
      next: (rs) => {
        this.roles = rs || [];
        if (!this.rolSeleccionadoId && this.roles.length) {
          this.rolSeleccionadoId = this.roles[0].id;
          this.refrescarMiembros();
        }
      }
    });
  }

  abrirAgregarRol(): void {
    const ref = this.dialog.open(DialogRolComponent, {
      width: '420px',
      maxWidth: '96vw',
      data: { modo: 'crear', liderazgoId: this.data.liderazgoId },
      panelClass: 'dlg-rol-panel'
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.cargarRoles(); });
  }

  // Edición inline
  activarEdicion(r: Rol): void {
    this.editId = r.id;
    this.editNameCtrl.setValue(r.nombre);
  }
  cancelarEdicion(): void {
    this.editId = null;
    this.editNameCtrl.reset('');
  }
  guardarEdicion(r: Rol): void {
    const nombre = (this.editNameCtrl.value || '').trim();
    if (!nombre || nombre === r.nombre) { this.cancelarEdicion(); return; }

    this.lsvc.editarRol(this.data.liderazgoId, r.id, nombre).subscribe({
      next: () => {
        r.nombre = nombre;
        this.cancelarEdicion();
      }
    });
  }
eliminarRolInline(r: Rol): void {
  this.lsvc.eliminarRol(this.data.liderazgoId, r.id).subscribe({
    next: () => {
      // Quita el rol de la lista sin recargar
      this.roles = this.roles.filter(x => x.id !== r.id);

      // Si el rol eliminado estaba seleccionado, limpia la selección
      if (this.rolSeleccionadoId === r.id) {
        this.rolSeleccionadoId = null;
        this.refrescarMiembros();
      }
    },
    error: (err) => {
      console.error('Error eliminando rol', err);
    }
  });
}


  // ---------------- Miembros ----------------
  private cargarMiembros(): void {
    this.cargando = true;
    this.lsvc.listarMiembros(this.data.liderazgoId).subscribe({
      next: (list) => {
        this.miembrosRaw = list || [];
        this.refrescarMiembros();
        this.cargando = false;
      },
      error: () => (this.cargando = false)
    });
  }

  refrescarMiembros(): void {
    if (!this.rolSeleccionadoId) {
      this.miembros = this.miembrosRaw.slice();
      return;
    }
    this.miembros = this.miembrosRaw.filter(m => m.rolId === this.rolSeleccionadoId);
  }

  agregar(): void {
  const personaId = this.personaSelCtrl.value;
  const rolId = this.rolSeleccionadoId;

  if (!personaId || !rolId) return;

  this.lsvc.agregarMiembro(this.data.liderazgoId, personaId, rolId).subscribe({
    next: () => {
      this.personaSelCtrl.reset(null);
      this.cargarMiembros(); // refresca la tabla derecha
    }
  });
  }

  quitar(m: MiembroRol): void {
    if (!confirm(`¿Quitar a ${m.nombrePersona}?`)) return;
    this.lsvc.eliminarMiembro(this.data.liderazgoId, m.id).subscribe({
      next: () => this.cargarMiembros()
    });
  }

  // Combo de personas
  private cargarMiembrosCombo(): void {
    this.personasSvc.listarTodos().subscribe({
      next: (list) => (this.miembrosCombo = list || []),
    });
    // Fallback si no tienes listarTodos():
    // this.personasSvc.buscar('*').subscribe(list => this.miembrosCombo = list || []);
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
