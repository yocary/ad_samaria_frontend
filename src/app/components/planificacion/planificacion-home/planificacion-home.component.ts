import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  LiderazgoService,
  Liderazgo,
} from 'src/app/services/liderazgo.service';

@Component({
  selector: 'app-planificacion-home',
  templateUrl: './planificacion-home.component.html',
  styleUrls: ['./planificacion-home.component.scss'],
})
export class PlanificacionHomeComponent implements OnInit {
  cargando = true;
  liderazgos: Liderazgo[] = [];

  // solo para variar el borde superior de las tarjetas
  palette = ['teal', 'green', 'amber', 'blue', 'purple'];

  constructor(private liderazgoSvc: LiderazgoService, private router: Router) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    // si quieres filtrar por texto, pásalo como argumento (p.ej. this.liderazgoSvc.listarLiderazgos(this.q))
    this.liderazgoSvc.listarLiderazgos().subscribe({
      next: (res) => {
        this.liderazgos = res || [];
        this.cargando = false;
      },
      error: () => {
        this.liderazgos = [];
        this.cargando = false;
      },
    });
  }

  verLiderazgo(id: number, nombre: string): void {
    this.router.navigate(['/planificacion/grupo', id], {
      queryParams: { nombre: nombre },
    });
  }

  regresar(): void {
    this.router.navigate(['/dashboard']);
  }

  colorClass(i: number): string {
    return `c-${this.palette[i % this.palette.length]}`;
  }
}
