import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import { FamiliesService } from 'src/app/services/families.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dialog-add-family',
  templateUrl: './dialog-add-family.component.html',
})
export class DialogAddFamilyComponent {
  name = new FormControl('', [Validators.required, Validators.maxLength(120)]);
  saving = false;

  constructor(
    private ref: MatDialogRef<DialogAddFamilyComponent>,
    private families: FamiliesService
  ) {}

  save() {
    if (this.name.invalid) {
      this.name.markAsTouched();
      return;
    }

    this.saving = true;
    this.families.crearFamilia(this.name.value!.trim()).subscribe({
      next: () => {
        this.ref.close(true);
        Swal.fire({
          title: '¡Éxito!',
          text: 'Familia creada correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          title: 'Error',
          text: 'No se pudo crear la familia',
          icon: 'error',
          confirmButtonText: 'Aceptar',
        });
      },
    });
  }
  cancel() {
    this.ref.close(false);
  }
}
