import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  MiembrosService,
  OpcionCatalogo,
  CrearMiembroRequest,
} from 'src/app/services/miembros.service';
import { ActivatedRoute, Router } from '@angular/router';

// ✅ DateAdapter nativo con formato dd/MM/yyyy
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { DDMYYYYDateAdapter } from '../shared/ddmmyyyy-date-adapter'; 

// Formatos personalizados dd/MM/yyyy
export const MY_DATE_FORMATS = {
  parse: { dateInput: 'DD/MM/YYYY' },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-miembros-form',
  templateUrl: './miembros-form.component.html',
  styleUrls: ['./miembros-form.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: DDMYYYYDateAdapter }, // ← usa tu adaptador nativo
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'es-GT' },
  ],
})
export class MiembrosFormComponent implements OnInit {
  // modo edición
  isEdit = false;
  miembroId: number | null = null;

  // catálogos
  tiposPersona: OpcionCatalogo[] = [];
  sexos: OpcionCatalogo[] = [];
  clasificaciones: OpcionCatalogo[] = [];
  estadosCiviles: OpcionCatalogo[] = [];

  form = this.fb.group({
    nombres: ['', [Validators.required, Validators.maxLength(120)]],
    apellidoPaterno: ['', [Validators.required, Validators.maxLength(80)]],
    apellidoMaterno: ['', [Validators.maxLength(80)]],

    // ✅ Teléfono: solo números y exactamente 8 dígitos
    telefono: ['', [Validators.pattern(/^[0-9]{8}$/)]],

    direccion: ['', [Validators.maxLength(200)]],

    tipoPersonaId: [null as number | null, Validators.required],
    sexoId: [null as number | null, Validators.required],
    clasificacionId: [null as number | null, Validators.required],
    estadoCivilId: [null as number | null, Validators.required],

    fechaNacimiento: [null, Validators.required], // Date (MatDatepicker)
  });

  constructor(
    private fb: FormBuilder,
    private svc: MiembrosService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Determinar si es edición según param id
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      this.isEdit = !!idStr;
      this.miembroId = idStr ? Number(idStr) : null;
    });

    // Cargar catálogos en paralelo
    this.svc.getTiposPersona().subscribe((list) => { this.tiposPersona = list; });
    this.svc.getSexos().subscribe((list) => { this.sexos = list; });
    this.svc.getClasificaciones().subscribe((list) => { this.clasificaciones = list; });
    this.svc.getEstadosCiviles().subscribe((list) => { this.estadosCiviles = list; });

    // Si es creación, setea defaults
    setTimeout(() => {
      if (!this.isEdit) {
        this.form.patchValue({
          tipoPersonaId: this.tiposPersona[0]?.id ?? null,
          sexoId: this.sexos[0]?.id ?? null,
          clasificacionId: this.clasificaciones[0]?.id ?? null,
          estadoCivilId: this.estadosCiviles[0]?.id ?? null,
        });
      }
    }, 0);

    // Si es edición, carga datos del miembro
    if (this.isEdit && this.miembroId) {
      this.svc.getMiembroForm(this.miembroId).subscribe({
        next: (dto) => this.patchFromDto(dto),
        error: (e) => {
          const msg = e?.error?.message || 'No se pudo cargar el miembro.';
          Swal.fire('Error', msg, 'error');
          this.router.navigate(['/miembros/home']);
        }
      });
    }
  }

  /** Convierte 'yyyy-MM-dd' a objeto Date */
  private toDate(yyyyMMdd: string | undefined | null): Date | null {
    if (!yyyyMMdd) return null;
    const [y, m, d] = yyyyMMdd.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  private patchFromDto(dto: CrearMiembroRequest) {
    this.form.patchValue({
      nombres: dto.nombres,
      apellidoPaterno: dto.apellidoPaterno,
      apellidoMaterno: dto.apellidoMaterno || '',
      telefono: dto.telefono || '',
      direccion: dto.direccion || '',

      tipoPersonaId: dto.tipoPersonaId,
      sexoId: dto.sexoId,
      clasificacionId: dto.clasificacionId,
      estadoCivilId: dto.estadoCivilId,

      // convierte yyyy-MM-dd a objeto Date
      fechaNacimiento: this.toDate(dto.fechaNacimiento),
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire('Formulario incompleto', 'Revisa los campos requeridos.', 'warning');
      return;
    }

    const v = this.form.getRawValue();
    const f: Date | null = v.fechaNacimiento as any;

    // Convierte Date a 'yyyy-MM-dd' para backend
    const yyyyMMdd = f
      ? `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`
      : '';

    const payload: CrearMiembroRequest = {
      nombres: v.nombres!.trim(),
      apellidoPaterno: v.apellidoPaterno!.trim(),
      apellidoMaterno: (v.apellidoMaterno || '').trim(),
      telefono: (v.telefono || '').trim(),
      direccion: (v.direccion || '').trim(),
      tipoPersonaId: v.tipoPersonaId!,
      sexoId: v.sexoId!,
      clasificacionId: v.clasificacionId!,
      estadoCivilId: v.estadoCivilId!,
      fechaNacimiento: yyyyMMdd,
    };

    // Crear o actualizar
    if (this.isEdit && this.miembroId) {
      this.svc.actualizarMiembroForm(this.miembroId, payload).subscribe({
        next: () => {
          Swal.fire('Actualizado', 'El miembro se actualizó correctamente.', 'success');
          this.router.navigate(['/miembros/home']);
        },
        error: (e) => {
          const msg = e?.error?.message || 'Ocurrió un error al actualizar';
          Swal.fire('Error', msg, 'error');
        },
      });
    } else {
      this.svc.crearMiembroForm(payload).subscribe({
        next: () => {
          Swal.fire('Guardado', 'El miembro se guardó correctamente.', 'success');
          this.router.navigate(['/miembros/home']);
        },
        error: (e) => {
          const msg = e?.error?.message || 'Ocurrió un error al guardar';
          Swal.fire('Error', msg, 'error');
        },
      });
    }
  }

  cancelar(): void {
    this.router.navigate(['/miembros/home']);
  }

  hasError(ctrl: string, error: string) {
    const c = this.form.get(ctrl);
    return !!c && c.touched && c.hasError(error);
  }

  /** ✅ Permite solo números en el campo teléfono */
  soloNumeros(event: KeyboardEvent): void {
    const charCode = event.key.charCodeAt(0);
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }
}
