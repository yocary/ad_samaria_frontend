import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-roles-home',
  templateUrl: './roles-home.component.html',
  styleUrls: ['./roles-home.component.scss']
})
export class RolesHomeComponent {
  constructor(private router: Router) {}

  goAdd() { this.router.navigate(['./roles/agregar']); }
  goRemove() { this.router.navigate(['./roles/eliminar']); }
  regresar() { this.router.navigate(['/dashboard']); }
}
