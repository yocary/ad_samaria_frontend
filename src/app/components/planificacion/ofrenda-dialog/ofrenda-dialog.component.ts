import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EventoItem } from '../planificacion-eventos/tipos';

export interface OfrendaDialogData {
  liderazgoNombre?: string;
  eventos: EventoItem[];
  eventoIdDefault?: number;
  fechaDefault?: string;
  ofrendaExistente?: OfrendaItem; // Nueva propiedad para edición
}

export interface OfrendaPayload {
  id?: number; // Nuevo campo para edición
  fecha: string;
  descripcion?: string;
  cantidad: number;
  eventoId: number;
}

export interface OfrendaItem {
  id: number;
  fecha: string;
  descripcion?: string;
  cantidad: number;
  eventoId: number;
}

@Component({
  selector: 'app-ofrenda-dialog',
  templateUrl: './ofrenda-dialog.component.html',
  styleUrls: ['./ofrenda-dialog.component.scss']
})
export class OfrendaDialogComponent implements OnInit {
  eventos: EventoItem[] = [];
  isEdit = false;
  ofrendaId?: number;

  form = this.fb.group({
    fecha: [null as Date | null, Validators.required],
    descripcion: [''],
    cantidad: [null as number | null, [Validators.required, Validators.min(0)]],
    eventoId: [null as number | null, Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private ref: MatDialogRef<OfrendaDialogComponent, OfrendaPayload | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: OfrendaDialogData
  ) {}

  ngOnInit(): void {
    this.eventos = this.data?.eventos ?? [];
    
    // Si hay ofrenda existente, estamos en modo edición
    if (this.data?.ofrendaExistente) {
      this.isEdit = true;
      this.ofrendaId = this.data.ofrendaExistente.id;
      this.cargarDatosExistente(this.data.ofrendaExistente);
    } else {
      // Modo creación - preseleccionar valores por defecto
      if (this.data?.eventoIdDefault) {
        this.form.patchValue({ eventoId: this.data.eventoIdDefault });
      }

      if (this.data?.fechaDefault) {
        const [y, m, d] = this.data.fechaDefault.split('-').map(Number);
        const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
        if (!isNaN(dt.getTime())) {
          this.form.patchValue({ fecha: dt });
        }
      } else {
        // Si no hay fecha por defecto, usar fecha actual
        this.form.patchValue({ fecha: new Date() });
      }
    }
  }

  private cargarDatosExistente(ofrenda: OfrendaItem): void {
    // Convertir fecha string a Date
    const [y, m, d] = ofrenda.fecha.split('-').map(Number);
    const fechaDate = new Date(y, m - 1, d);
    
    this.form.patchValue({
      fecha: fechaDate,
      descripcion: ofrenda.descripcion || '',
      cantidad: ofrenda.cantidad,
      eventoId: ofrenda.eventoId
    });

    // En modo edición, deshabilitar el campo eventoId
    this.form.get('eventoId')?.disable();
  }

  cancelar(): void { 
    this.ref.close(undefined); 
  }

  guardar(): void {
    if (this.form.invalid) { 
      this.form.markAllAsTouched(); 
      return; 
    }

    const raw = this.form.getRawValue();
    
    if (!raw.fecha) {
      return;
    }

    const f = raw.fecha as Date;
    const iso = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;

    const payload: OfrendaPayload = {
      id: this.ofrendaId, // Incluir ID en modo edición
      fecha: iso,
      descripcion: (raw.descripcion || '').trim() || undefined,
      cantidad: Number(raw.cantidad),
      eventoId: Number(raw.eventoId)
    };

    this.ref.close(payload);
  }
}