import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import { LiderazgoService, Rol } from 'src/app/services/liderazgo.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dialog-rol',
  templateUrl: './dialog-rol.component.html',
  styleUrls: ['./dialog-rol.component.scss']
})
export class DialogRolComponent {
  nombreCtrl = new FormControl('', Validators.required);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { modo: 'crear'|'editar'; liderazgoId: number; rol?: Rol },
    private dialogRef: MatDialogRef<DialogRolComponent>,
    private svc: LiderazgoService
  ) {
    if (data.modo === 'editar' && data.rol) this.nombreCtrl.setValue(data.rol.nombre);
  }

async guardar() {
  const nombre = (this.nombreCtrl.value || '').trim();
  if (!nombre) return;

  try {
    if (this.data.modo === 'crear') {
      await this.svc.crearRol(this.data.liderazgoId, nombre).toPromise();
    } else {
      await this.svc.editarRol(this.data.liderazgoId, this.data.rol!.id, nombre).toPromise();
    }
    
    Swal.fire('Ok', 'Rol guardado con éxito', 'success');
    this.dialogRef.close(true);
  } catch (error: any) {
    console.error(error);
    Swal.fire('Error', 'No se pudo guardar el rol', 'error');
  }
}

}
