import { Component, Input } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

export interface PersonaItem {
  id: number;
  nombreCompleto: string;
}

type Rol = 'Administrador' | 'Líder';

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent {
  @Input() personas: PersonaItem[] = [
    { id: 1, nombreCompleto: 'Yocary Coronado' },
    { id: 2, nombreCompleto: 'Madelline Duarte' },
  ];

  roles: Rol[] = ['Administrador', 'Líder'];

  form = this.fb.group({
    personaId: [null, Validators.required],
    rol: [null as Rol | null, Validators.required],
  });

  constructor(private fb: FormBuilder) {}

  agregar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.value as { personaId: number; rol: Rol };

    Swal.fire('Rol asignado', 'El rol fue asignado correctamente.', 'success');
    this.form.reset();
  }
}
