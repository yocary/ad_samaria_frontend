import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-miembros-form',
  templateUrl: './miembros-form.component.html',
  styleUrls: ['./miembros-form.component.scss'],
})
export class MiembrosFormComponent {
  tiposPersona = ['Miembro', 'Visitante'];
  sexos = ['Hombre', 'Mujer'];
  clasificaciones = ['Niños', 'Jóvenes', 'Adultos', 'Ancianos'];
  estadosCiviles = ['Soltero (a)', 'Casado (a)', 'Divorciado (a)', 'Viudo (a)'];

  form = this.fb.group({
    nombres: ['', [Validators.required, Validators.maxLength(120)]],
    apellidoPaterno: ['', [Validators.required, Validators.maxLength(80)]],
    apellidoMaterno: ['', [Validators.maxLength(80)]],
    telefono: ['', [Validators.pattern(/^[0-9\s+-]{8,20}$/)]],
    dpi: ['', [Validators.minLength(8), Validators.maxLength(25)]],
    direccion: ['', [Validators.maxLength(200)]],
    tipoPersona: ['Miembro', Validators.required],
    sexo: ['Hombre', Validators.required],
    clasificacion: ['Niños', Validators.required],
    estadoCivil: ['Soltero (a)', Validators.required],
    fechaNacimiento: [null, Validators.required],
  });

  constructor(private fb: FormBuilder) {}

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire('Formulario incompleto', 'Revisa los campos requeridos.', 'warning');
      return;
    }
    Swal.fire('Guardado', 'El miembro se guardó correctamente.', 'success');
    this.form.reset({
      tipoPersona: 'Miembro',
      sexo: 'Hombre',
      clasificacion: 'Niños',
      estadoCivil: 'Soltero (a)'
    });
  }

  cancelar(): void {
    this.form.reset({
      tipoPersona: 'Miembro',
      sexo: 'Hombre',
      clasificacion: 'Niños',
      estadoCivil: 'Soltero (a)'
    });
  }

  hasError(ctrl: string, error: string) {
    const c = this.form.get(ctrl);
    return !!c && c.touched && c.hasError(error);
  }
}
