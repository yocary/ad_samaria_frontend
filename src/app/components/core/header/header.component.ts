import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UsuarioActual } from 'src/app/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  user: UsuarioActual | null = null;
  private sub?: Subscription;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Estado actual + suscripción a cambios
    this.user = this.auth.usuarioActual;
    this.sub = this.auth.usuario.subscribe((u) => (this.user = u));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  get displayName(): string {
    // Muestra nombre si existe; si no, email/username; si no, “Usuario”
    const u = this.user;
    return (
      (u?.nombre && u?.nombre.trim()) ||
      'Usuario'
    );
  }
}
