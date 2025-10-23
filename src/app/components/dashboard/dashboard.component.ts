import { Component } from '@angular/core';

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
export class DashboardComponent {
  tiles: Tile[] = [
    { key: 'roles',         title: 'ROLES',          routerLink: '/roles/home' },
    { key: 'miembros',      title: 'MIEMBROS',       routerLink: '/miembros/home' },
    // { key: 'finanzas',      title: 'FINANZAS',       routerLink: '/finanzas' },
    { key: 'planificacion', title: 'PLANIFICACIÓN',  routerLink: '/planificacion' },
    { key: 'liderazgo',     title: 'LIDERAZGO',      routerLink: '/liderazgo' },
    { key: 'certificados',  title: 'CERTIFICADOS',   routerLink: '/certificados' },
  ];

  // Para marcar activo si lo necesitas (opcional)
  activeKey: Tile['key'] | null = null;
  setActive(k: Tile['key']) { this.activeKey = k; }
}
