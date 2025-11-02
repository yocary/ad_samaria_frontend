import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import { Liderazgo, LiderazgoService } from 'src/app/services/liderazgo.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dialog-edit-ministry',
  templateUrl: './dialog-edit-ministry.component.html',
  styleUrls: ['./dialog-edit-ministry.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DialogEditMinistryComponent {
  nombreCtrl = new FormControl('', Validators.required);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { liderazgo: Liderazgo },
    private dialogRef: MatDialogRef<DialogEditMinistryComponent>,
    private svc: LiderazgoService
  ) {
    this.nombreCtrl.setValue(data.liderazgo.nombre);
  }

  guardar() {
    const n = (this.nombreCtrl.value || '').trim();
    if (!n) return;
    this.svc.editarLiderazgo(this.data.liderazgo.id, n).subscribe({
      next: () => this.dialogRef.close(true)
    });
  }
}