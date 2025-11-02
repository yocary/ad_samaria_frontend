import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService, UsuarioActual } from 'src/app/services/auth.service';
import { Subscription } from 'rxjs';

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
export class DashboardComponent implements OnInit, OnDestroy {

  allTiles: Tile[] = [
    { key: 'roles',         title: 'ROLES',          routerLink: '/roles/home' },
    { key: 'miembros',      title: 'MIEMBROS',       routerLink: '/miembros/home' },
    { key: 'finanzas',      title: 'FINANZAS',       routerLink: '/finanzas' },
    { key: 'planificacion', title: 'PLANIFICACIÓN',  routerLink: '/planificacion' },
    { key: 'liderazgo',     title: 'LIDERAZGO',      routerLink: '/liderazgo' },
    { key: 'certificados',  title: 'CERTIFICADOS',   routerLink: '/certificados' },
  ];

  tiles: Tile[] = [];
  activeKey: Tile['key'] | null = null;

  private sub?: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Calcula inmediatamente si ya hay usuario cargado
    const u = this.authService.usuarioActual;
    this.tiles = this.buildTiles(u);

    // Y suscríbete por si cambia (login/logout o refrescos)
    this.sub = this.authService.usuario.subscribe(user => {
      this.tiles = this.buildTiles(user);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  setActive(k: Tile['key']) {
    this.activeKey = k;
  }

  logout(): void {
    this.authService.logout();
    window.location.reload();
  }

  // ================= Helpers =================

  /** Normaliza roles: mayúsculas, sin espacios, sin tildes */
  private normRole(raw?: string): string {
    if (!raw) return '';
    return raw
      .trim()
      .toUpperCase()
      .normalize('NFD')                // separa tildes
      .replace(/[\u0300-\u036f]/g, ''); // elimina tildes
  }

  /** Devuelve true si el usuario tiene el rol, con y sin prefijo ROLE_, con/sin tildes */
  private hasRole(rolesNorm: Set<string>, role: string): boolean {
    const r = this.normRole(role);
    return rolesNorm.has(r) || rolesNorm.has('ROLE_' + r);
  }

  /** Construye los tiles en base a roles (mezcla permisos de múltiples roles) */
  private buildTiles(user: UsuarioActual | null): Tile[] {
    if (!user) return [];

    // Normaliza y carga a un Set para búsquedas rápidas
    const rolesNorm = new Set<string>((user.roles || []).map(r => this.normRole(r)));

    const want = new Set<Tile['key']>();

    // ADMINISTRADOR: todo menos finanzas (según tu regla original)
    if (this.hasRole(rolesNorm, 'ADMINISTRADOR')) {
      ['roles', 'miembros', 'planificacion', 'liderazgo', 'certificados', 'finanzas']
        .forEach(k => want.add(k as Tile['key']));
    }

    // LÍDER (acepta ROLE_LÍDER, ROLE_LIDER, LIDER)
    if (this.hasRole(rolesNorm, 'LIDER')) {
      ['miembros', 'planificacion', 'liderazgo']
        .forEach(k => want.add(k as Tile['key']));
    }

    // TESORERO: siempre agrega FINANZAS (aunque también sea admin)
    if (this.hasRole(rolesNorm, 'TESORERO')) {
      want.add('finanzas');
    }

   if (this.hasRole(rolesNorm, 'pastor')) {
      ['miembros', 'finanzas', 'planificacion', 'certificados']
        .forEach(k => want.add(k as Tile['key']));
    }

    // PASTOR (si en algún momento necesitas lógica específica, aquí)
    // if (this.hasRole(rolesNorm, 'PASTOR')) { ... }

    // Filtra tiles por los que se pidieron
    return this.allTiles.filter(t => want.has(t.key));
  }
}
