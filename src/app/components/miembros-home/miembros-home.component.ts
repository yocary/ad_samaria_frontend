import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { PersonasService, PersonaMini } from 'src/app/services/personas.service';
import { MemberCardDialogComponent } from '../member-card-dialog/member-card-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { CrearUsuarioDialogComponent } from '../crear-usuario-dialog/crear-usuario-dialog.component';
import { AuthService, UsuarioActual } from 'src/app/services/auth.service';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-miembros-home',
  templateUrl: './miembros-home.component.html',
  styleUrls: ['./miembros-home.component.scss']
})
export class MiembrosHomeComponent implements OnInit, OnDestroy {
  search = new FormControl('');
  all: PersonaMini[] = [];
  filtered: PersonaMini[] = [];
  private subs: Subscription[] = [];
  usuario: UsuarioActual | null = null;

  constructor(
    private miembrosSvc: PersonasService,
    private router: Router,
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.usuarioActual;

    const s1 = this.miembrosSvc.listarTodos().subscribe({
      next: (list) => {
        this.all = list || [];
        this.applyFilter();
      },
      error: (e) => console.error('Error cargando miembros', e)
    });
    this.subs.push(s1);

    const s2 = this.search.valueChanges.pipe(debounceTime(200)).subscribe(() => this.applyFilter());
    this.subs.push(s2);
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  private normalize(x: string): string {
    return (x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  private applyFilter(): void {
    const q = this.normalize(this.search.value || '');
    this.filtered = !q ? [...this.all] : this.all.filter(p => this.normalize(p.nombre).includes(q));
  }

  esAdministrador(): boolean {
    return this.usuario?.roles.includes('ROLE_ADMINISTRADOR') ?? false;
  }

  agregarPersona() { this.router.navigate(['/miembros/nuevo']); }
  agregarFamilia() { this.router.navigate(['/familias']); }
  regresar() { this.router.navigate(['/dashboard']); }

  verFicha(personaId: number, nombre?: string) {
    this.dialog.open(MemberCardDialogComponent, { width: '980px', data: { personaId, nombre } });
  }

  crearUsuarioPara(row: PersonaMini) {
    if (!this.esAdministrador()) return; // Solo admin puede crear usuario

    this.dialog.open(CrearUsuarioDialogComponent, {
      width: '400px',
      data: { personaId: row.id, dpi: row.dpi ?? '' },
    }).afterClosed().subscribe((res: any) => {
      if (res) {
        const username = res.username;
        const password = res.password;
        this.descargarCredenciales(username, password);
      }
    });
  }

  private descargarCredenciales(username: string, password: string) {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Credenciales de Acceso', 20, 20);
    doc.setFontSize(12);
    doc.text(`Usuario: ${username}`, 20, 40);
    doc.text(`Contraseña: ${password}`, 20, 50);
    doc.save(`credenciales_${username}.pdf`);
  }
}
