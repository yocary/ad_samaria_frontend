import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  MiembrosService,
  OpcionCatalogo,
} from 'src/app/services/miembros.service';
import { Router } from '@angular/router';

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  },
};

@Component({
  selector: 'app-miembros-form',
  templateUrl: './miembros-form.component.html',
  styleUrls: ['./miembros-form.component.scss'],
})
export class MiembrosFormComponent implements OnInit {
  // listas que vendrán del backend
  tiposPersona: OpcionCatalogo[] = [];
  sexos: OpcionCatalogo[] = [];
  clasificaciones: OpcionCatalogo[] = [];
  estadosCiviles: OpcionCatalogo[] = [];

  form = this.fb.group({
    nombres: ['', [Validators.required, Validators.maxLength(120)]],
    apellidoPaterno: ['', [Validators.required, Validators.maxLength(80)]],
    apellidoMaterno: ['', [Validators.maxLength(80)]],
    telefono: ['', [Validators.pattern(/^[0-9\s+-]{8,20}$/)]],
    dpi: ['', [Validators.minLength(8), Validators.maxLength(25)]],
    direccion: ['', [Validators.maxLength(200)]],

    // ahora trabajamos con IDs (number)
    tipoPersonaId: [null as number | null, Validators.required],
    sexoId: [null as number | null, Validators.required],
    clasificacionId: [null as number | null, Validators.required],
    estadoCivilId: [null as number | null, Validators.required],

    fechaNacimiento: [null, Validators.required], // Date del datepicker
  });

  constructor(private fb: FormBuilder, private svc: MiembrosService, private router: Router) {}

  ngOnInit(): void {
    // Cargar catálogos (en paralelo) y setear defaults
    this.svc.getTiposPersona().subscribe((list) => {
      this.tiposPersona = list;
      if (list.length) this.form.patchValue({ tipoPersonaId: list[0].id });
    });
    this.svc.getSexos().subscribe((list) => {
      this.sexos = list;
      if (list.length) this.form.patchValue({ sexoId: list[0].id });
    });
    this.svc.getClasificaciones().subscribe((list) => {
      this.clasificaciones = list;
      if (list.length) this.form.patchValue({ clasificacionId: list[0].id });
    });
    this.svc.getEstadosCiviles().subscribe((list) => {
      this.estadosCiviles = list;
      if (list.length) this.form.patchValue({ estadoCivilId: list[0].id });
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire(
        'Formulario incompleto',
        'Revisa los campos requeridos.',
        'warning'
      );
      return;
    }

    const v = this.form.getRawValue();

    // convertir Date → 'yyyy-MM-dd'
    const f: Date | null = v.fechaNacimiento as any;
    const yyyyMMdd = f
      ? `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(
          2,
          '0'
        )}-${String(f.getDate()).padStart(2, '0')}`
      : '';

    const payload = {
      nombres: v.nombres!.trim(),
      apellidoPaterno: v.apellidoPaterno!.trim(),
      apellidoMaterno: (v.apellidoMaterno || '').trim(),
      telefono: (v.telefono || '').trim(),
      dpi: (v.dpi || '').trim(),
      direccion: (v.direccion || '').trim(),

      tipoPersonaId: v.tipoPersonaId!,
      sexoId: v.sexoId!,
      clasificacionId: v.clasificacionId!,
      estadoCivilId: v.estadoCivilId!,

      fechaNacimiento: yyyyMMdd,
    };

    this.svc.crearMiembroForm(payload).subscribe({
      next: () => {
        Swal.fire('Guardado', 'El miembro se guardó correctamente.', 'success');
        this.resetDefaults();
      },
      error: (e) => {
        const msg = e?.error?.message || 'Ocurrió un error al guardar';
        Swal.fire('Error', msg, 'error');
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/dashboard']);
  }

  private resetDefaults() {
    this.form.reset({
      tipoPersonaId: this.tiposPersona[0]?.id ?? null,
      sexoId: this.sexos[0]?.id ?? null,
      clasificacionId: this.clasificaciones[0]?.id ?? null,
      estadoCivilId: this.estadosCiviles[0]?.id ?? null,
      fechaNacimiento: null,
    });
  }

  hasError(ctrl: string, error: string) {
    const c = this.form.get(ctrl);
    return !!c && c.touched && c.hasError(error);
  }
}
