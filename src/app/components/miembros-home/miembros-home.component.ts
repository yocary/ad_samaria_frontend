import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-miembros-home',
  templateUrl: './miembros-home.component.html',
  styleUrls: ['./miembros-home.component.scss']
})
export class MiembrosHomeComponent {
  constructor(private router: Router) {}

  agregarPersona() {
    this.router.navigate(['/miembros/form']);
  }

  agregarFamilia() {
    this.router.navigate(['/familias/form']); 
  }

  regresar() {
    this.router.navigate(['/dashboard']);
  }
}