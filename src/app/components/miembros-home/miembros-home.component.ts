import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { PersonasService, PersonaMini } from 'src/app/services/personas.service';
import { MemberCardDialogComponent } from '../member-card-dialog/member-card-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { CrearUsuarioDialogComponent } from '../crear-usuario-dialog/crear-usuario-dialog.component';
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

  constructor(private miembrosSvc: PersonasService, private router: Router, private dialog: MatDialog) {}

  ngOnInit(): void {
    // 1) Carga inicial de TODOS los miembros
    const s1 = this.miembrosSvc.listarTodos().subscribe({
      next: (list) => {
        this.all = list || [];
        this.applyFilter();
      },
      error: (e) => console.error('Error cargando miembros', e)
    });
    this.subs.push(s1);

    // 2) Filtro reactivo
    const s2 = this.search.valueChanges.pipe(debounceTime(200)).subscribe(() => this.applyFilter());
    this.subs.push(s2);
  }

  private normalize(x: string): string {
    return (x || '')
      .toLowerCase()
      .normalize('NFD')              // quita tildes
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private applyFilter(): void {
    const q = this.normalize(this.search.value || '');
    if (!q) { this.filtered = [...this.all]; return; }
    this.filtered = this.all.filter(p => this.normalize(p.nombre).includes(q));
  }

  // Navegación
  agregarPersona() { this.router.navigate(['/miembros/nuevo']); }
  agregarFamilia() { this.router.navigate(['/familias']); }
  regresar() { this.router.navigate(['/dashboard']); }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  verFicha(personaId: number, nombre?: string) {
  this.dialog.open(MemberCardDialogComponent, {
    width: '980px',
    data: { personaId, nombre },
    disableClose: false
  });
}

  crearUsuario() {
    this.dialog.open(CrearUsuarioDialogComponent, {
      width: '400px',
      data: { 
        personaId: null, 
        dpi: '' 
      },
      disableClose: false
    });
  }

crearUsuarioPara(row: PersonaMini) {
  this.dialog.open(CrearUsuarioDialogComponent, {
    width: '400px',
    data: { personaId: row.id, dpi: row.dpi ?? '' },
  }).afterClosed().subscribe((res: any) => {
    if (res) {
      // Aquí res debería contener el username y password
      const username = res.username;
      const password = res.password; // O el que te devuelva el backend
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
