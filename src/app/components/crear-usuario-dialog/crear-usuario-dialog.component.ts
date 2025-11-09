// src/app/components/crear-usuario-dialog/crear-usuario-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/services/auth.service';

export interface CrearUsuarioData {
  personaId?: number | null; // si abres el diálogo desde una fila específica
}

// (Opcional) Si quieres, define el tipo esperado de la respuesta del backend.
// Si tu servicio no lo retorna así, déjalo como opcional.
interface CrearUsuarioResponse {
  username?: string;
  // agrega aquí otros campos si tu API los devuelve (id, email, etc.)
}

@Component({
  selector: 'app-crear-usuario-dialog',
  templateUrl: './crear-usuario-dialog.component.html',
  styleUrls: ['./crear-usuario-dialog.component.scss'],
})
export class CrearUsuarioDialogComponent implements OnInit {
  cargando = false;
  usernameSugerido: string = '';

  form = this.fb.group(
    {
      username: [null, [Validators.required, Validators.minLength(3)]],
      password: [null, [Validators.required, Validators.minLength(6)]],
      confirm: [null, [Validators.required]],
    },
    { validators: [this.passwordsIgualesValidator] }
  );

  constructor(
    private fb: FormBuilder,
    private ref: MatDialogRef<
      CrearUsuarioDialogComponent,
      { username: string; password: string } | null
    >,
    @Inject(MAT_DIALOG_DATA) public data: CrearUsuarioData,
    private usuariosSvc: AuthService
  ) {}

  ngOnInit(): void {
    if (this.data?.personaId) {
      this.obtenerUsernameSugerido();
    }
  }

  cancelar(): void {
    this.ref.close(null);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const chosenUsername: string | null =
      (raw.username as string) || this.usernameSugerido || null;

    if (!chosenUsername) {
      Swal.fire(
        'Atención',
        'No hay nombre de usuario. Intente obtener la sugerencia o escriba uno.',
        'warning'
      );
      return;
    }

    const payload: any = {
      username: chosenUsername,
      password: raw.password,
    };

    if (this.data?.personaId) {
      payload.personaId = this.data.personaId;
    }

    this.cargando = true;

    this.usuariosSvc.crearUsuario(payload).subscribe({
      next: (res: unknown) => {
        this.cargando = false;

        let finalUsername = chosenUsername;
        // type guard seguro
        if (
          res &&
          typeof res === 'object' &&
          'username' in (res as Record<string, unknown>)
        ) {
          finalUsername =
            (res as CrearUsuarioResponse).username ?? chosenUsername!;
        }

        Swal.fire(
          'Usuario creado',
          'El usuario se creó correctamente.',
          'success'
        );

        this.ref.close({
          username: finalUsername!,
          password: raw.password as string,
        });
      },
      error: (err) => {
        this.cargando = false;
        if (err?.status === 409) {
          Swal.fire(
            'Atención',
            err?.error || 'Conflicto al crear el usuario.',
            'warning'
          );
        } else {
          Swal.fire('Error', 'No se pudo crear el usuario.', 'error');
        }
      },
    });
  }

  private passwordsIgualesValidator(ctrl: AbstractControl) {
    const p = ctrl.get('password')?.value;
    const c = ctrl.get('confirm')?.value;
    return p && c && p !== c ? { noMatch: true } : null;
  }

  obtenerUsernameSugerido(): void {
    const id = this.data?.personaId;
    if (id == null) {
      return;
    }

    this.usuariosSvc.sugerirUsername(id).subscribe({
      next: (response) => {
        this.usernameSugerido = (response as any)?.username ?? '';

        const actual = this.form.get('username')?.value;
        if (!actual) {
          this.form.patchValue({ username: this.usernameSugerido });
        } else {
        }
      },
      error: (e) => {},
    });
  }

  // 🔹 Función para descargar un archivo con username y password
  private descargarCredenciales(username: string, password: string): void {
    const contenido = `Usuario: ${username}\nContraseña: ${password}`;
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `credenciales_${username}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
