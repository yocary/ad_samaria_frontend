import { Component } from '@angular/core';
import { FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-cambiar-password-dialog',
  templateUrl: './cambiar-password-dialog.component.html',
  styleUrls: ['./cambiar-password-dialog.component.scss'],
})
export class CambiarPasswordDialogComponent {
  cargando = false;

  form = this.fb.group(
    {
      username: ['', Validators.required],
      passwordActual: ['', Validators.required],
      passwordNuevo: ['', [Validators.required, Validators.minLength(6)]],
      confirmarPassword: ['', Validators.required],
    },
    { validators: [this.passwordsIgualesValidator] }
  );

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private dialogRef: MatDialogRef<CambiarPasswordDialogComponent>
  ) {}

  // Getter para saber si las contraseñas no coinciden
  get passwordNoMatch(): boolean {
    return (
      this.form.hasError('noMatch') &&
      !!this.form.get('confirmarPassword')?.touched
    );
  }

  guardar(): void {
    const { username, passwordActual, passwordNuevo, confirmarPassword } =
      this.form.value;

    // Validación: nueva contraseña y confirmación deben coincidir
    if (passwordNuevo !== confirmarPassword) {
      Swal.fire(
        'Error',
        'La nueva contraseña y su confirmación no coinciden',
        'error'
      );
      return;
    }

    // Validación: nueva contraseña no puede ser igual a la actual
    if (passwordNuevo === passwordActual) {
      Swal.fire(
        'Error',
        'La nueva contraseña no puede ser igual a la actual',
        'error'
      );
      return;
    }

    // Validación general de formulario
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando = true;

    this.auth
      .cambiarPassword(username!, passwordActual!, passwordNuevo!)
      .subscribe({
        next: () => {
          this.cargando = false;
          Swal.fire(
            'Listo',
            'Contraseña cambiada exitosamente',
            'success'
          ).then(() => {
            this.dialogRef.close(true);
          });
        },
        error: (err) => {
          this.cargando = false;
          const msg = err.error || 'Error al cambiar la contraseña';
          Swal.fire('Error', msg, 'error');
        },
      });
  }

  // Validador para comparar nueva contraseña y confirmación
  private passwordsIgualesValidator(ctrl: AbstractControl) {
    const nuevo = ctrl.get('passwordNuevo')?.value;
    const confirmar = ctrl.get('confirmarPassword')?.value;
    if (nuevo && confirmar && nuevo !== confirmar) {
      return { noMatch: true };
    }
    return null;
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
