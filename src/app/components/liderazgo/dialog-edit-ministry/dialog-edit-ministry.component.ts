import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { LiderazgoService } from 'src/app/services/liderazgo.service';

@Component({
  selector: 'app-dialog-edit-ministry',
  templateUrl: './dialog-edit-ministry.component.html',
  styleUrls: ['./dialog-edit-ministry.component.scss']
})
export class DialogEditMinistryComponent implements OnInit {
  liderazgoId!: number;
  nombreCtrl = new FormControl('');
  nuevoRolCtrl = new FormControl('');
  roles: string[] = [];

  guardando = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { liderazgoId: number; nombreActual: string },
    private dialogRef: MatDialogRef<DialogEditMinistryComponent>,
    private lsvc: LiderazgoService
  ) {}

  ngOnInit(): void {
    this.liderazgoId = this.data.liderazgoId;
    this.nombreCtrl.setValue(this.data.nombreActual);
    this.cargarRoles();
  }

  cargarRoles() {
    this.lsvc.listarRoles(this.liderazgoId).subscribe(list => this.roles = list);
  }

  guardarNombre() {
    const nombre = (this.nombreCtrl.value || '').trim();
    if (!nombre) return;
    this.guardando = true;
    this.lsvc.renombrar(this.liderazgoId, nombre).subscribe({
      next: () => { this.guardando = false; this.dialogRef.close(true); },
      error: () => { this.guardando = false; }
    });
  }

  agregarRol() {
    const nombre = (this.nuevoRolCtrl.value || '').trim();
    if (!nombre) return;
    this.lsvc.crearRol(this.liderazgoId, nombre).subscribe(() => {
      this.nuevoRolCtrl.reset('');
      this.cargarRoles();
    });
  }

  eliminarRol(idx: number) {
    // Si tu API expone DELETE por rolId, necesitarías tener {id,nombre}.
    // Aquí, como ejemplo, asumimos endpoint /roles?name=...
    // Lo correcto es que el backend devuelva {id,nombre}. Si ya lo tienes, ajusta:
    // this.lsvc.eliminarRol(rolId).subscribe(() => this.cargarRoles());

    // Por ahora mostramos aviso:
    console.warn('Elimina rol por id para producción. Ajusta el servicio si ya devuelves id.');
  }

  cerrar() { this.dialogRef.close(false); }
}
