import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { CambiarPasswordDialogComponent } from '../cambiar-password-dialog/cambiar-password-dialog.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  cargando = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
      private dialog: MatDialog
  ) {}

  login(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const { username, password } = this.form.value;

    this.auth.login(username!, password!).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.cargando = false;
        Swal.fire('Error', 'Credenciales incorrectas.', 'error');
      },
    });
  }

  abrirCambiarPassword(): void {
  this.dialog.open(CambiarPasswordDialogComponent, {
    width: '400px'
  });
}
}
