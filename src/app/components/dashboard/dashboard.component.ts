import { Component, OnInit } from '@angular/core';
import { AuthService, UsuarioActual } from 'src/app/services/auth.service';

interface Tile {
  key: 'roles' | 'miembros' | 'finanzas' | 'planificacion' | 'liderazgo' | 'reportes' | 'certificados';
  title: string;
  routerLink: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  allTiles: Tile[] = [
    { key: 'roles',         title: 'ROLES',          routerLink: '/roles/home' },
    { key: 'miembros',      title: 'MIEMBROS',       routerLink: '/miembros/home' },
    // { key: 'finanzas',      title: 'FINANZAS',       routerLink: '/finanzas' },
    { key: 'planificacion', title: 'PLANIFICACIÓN',  routerLink: '/planificacion' },
    { key: 'liderazgo',     title: 'LIDERAZGO',      routerLink: '/liderazgo' },
    { key: 'certificados',  title: 'CERTIFICADOS',   routerLink: '/certificados' },
  ];

  tiles: Tile[] = []; // Tiles que se mostrarán según rol
  activeKey: Tile['key'] | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const user: UsuarioActual | null = this.authService.usuarioActual;
    if (!user) return;

    const roles = user.roles; // Array de roles del usuario

    if (roles.includes('ROLE_ADMINISTRADOR')) {
      // Administrador ve todo menos finanzas y reportes
      this.tiles = this.allTiles.filter(t =>
        ['roles', 'miembros', 'planificacion', 'liderazgo', 'certificados'].includes(t.key)
      );
    } else if (roles.includes('ROLE_LÍDER')) {
      // Líder ve solo miembros, planificación y liderazgo
      this.tiles = this.allTiles.filter(t =>
        ['miembros', 'planificacion', 'liderazgo'].includes(t.key)
      );
    } else {
      // Por defecto, ningún tile
      this.tiles = [];
    }
  }

  setActive(k: Tile['key']) {
    this.activeKey = k;
  }

logout(): void {
  this.authService.logout();
  window.location.reload(); 
}


}
