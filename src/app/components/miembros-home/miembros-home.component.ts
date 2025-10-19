import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { PersonasService, PersonaMini } from 'src/app/services/personas.service';
import { MemberCardDialogComponent } from '../member-card-dialog/member-card-dialog.component';
import { MatDialog } from '@angular/material/dialog';

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
}
