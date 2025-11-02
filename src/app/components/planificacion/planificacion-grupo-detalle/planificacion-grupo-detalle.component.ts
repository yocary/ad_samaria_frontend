import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatFormField } from '@angular/material/form-field';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';
import Swal from 'sweetalert2';

import { LiderazgoService } from 'src/app/services/liderazgo.service';
import { MiembrosService } from 'src/app/services/miembros.service';
import { PersonaMini } from 'src/app/services/personas.service';

interface Miembro {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-planificacion-grupo-detalle',
  templateUrl: './planificacion-grupo-detalle.component.html',
  styleUrls: ['./planificacion-grupo-detalle.component.scss'],
})
export class PlanificacionGrupoDetalleComponent implements OnInit, AfterViewInit {
  @ViewChild(MatFormField) matField!: MatFormField;

  liderazgoId!: number;
  liderazgoNombre = '';

  // Tabs
  tabActivo: 'integrantes' | 'eventos' = 'integrantes';

  // Buscar/Agregar integrantes
  // Control acepta texto (mientras escribe) o el objeto seleccionado
personaQuery = new FormControl('');
  opcionesFiltradas$!: Observable<PersonaMini[]>;
  seleccionado?: PersonaMini;

  // Listado integrantes
  miembros: Miembro[] = [];
  cargandoMiembros = true;
  guardando = false;

  private rolBaseId: number | null = null;

  constructor(
    private liderazgoSvc: LiderazgoService,
    private miembrosSvc: MiembrosService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.liderazgoId = Number(this.route.snapshot.paramMap.get('id'));
    this.liderazgoNombre = this.route.snapshot.queryParamMap.get('nombre') || '';

    this.cargarMiembros();

    // Stream para autocomplete (si es objeto toma su nombre; si es string usa tal cual)
    this.opcionesFiltradas$ = this.personaQuery.valueChanges.pipe(
      startWith(this.personaQuery.value ?? ''),
      debounceTime(250),
      map(v => (typeof v === 'string' ? v : v?.nombre ?? '')),
      distinctUntilChanged(),
      switchMap((term: string) => {
        const q = term.trim();
        if (!q) {
          this.seleccionado = undefined;
        }
        return q.length < 2 ? of<PersonaMini[]>([]) : this.miembrosSvc.buscarMin$(q);
      })
    );

    // Obtener rol "miembro" del liderazgo
    this.liderazgoSvc.listarRoles(this.liderazgoId).subscribe({
      next: (roles) => {
        if (roles && roles.length) {
          const rMiembro = roles.find((r: any) => (r.nombre || '').toLowerCase().trim() === 'miembro');
          this.rolBaseId = rMiembro?.id ?? roles[0].id;
        } else {
          this.rolBaseId = null;
        }
      },
      error: () => (this.rolBaseId = null),
    });
  }

  // Fuerza el recalculo del notch/outline para evitar el “doble cuadro” en el primer render
  ngAfterViewInit(): void {
    setTimeout(() => {
      try {
        // API interna de MDC; funciona en Angular Material MDC
        (this.matField as any)?._foundation?.updateOutlineGap?.();
      } catch {
        // ignorar si no existe en alguna versión
      }
    });
  }

  // Cambiar tab (Integrantes/Eventos)
  cambiarTab(tab: 'integrantes' | 'eventos'): void {
    this.tabActivo = tab;
  }

  // Cargar integrantes del liderazgo
  cargarMiembros(): void {
    this.cargandoMiembros = true;
    this.liderazgoSvc.listarMiembros(this.liderazgoId).subscribe({
      next: (res: any[]) => {
        this.miembros = (res || []).map((r: any) => ({
          id: r.id ?? r.miembroId ?? r.liderazgoMiembroId,
          nombre: r.nombre ?? r.nombrePersona ?? r.miembroNombre ?? r.persona ?? '',
        }));
        this.cargandoMiembros = false;
      },
      error: () => {
        this.miembros = [];
        this.cargandoMiembros = false;
      },
    });
  }

  // displayWith del autocomplete
  displayPersona = (p?: PersonaMini | null): string => p?.nombre ?? '';

  // Selección desde el autocomplete: guarda el OBJETO en el control
  elegir(p: PersonaMini): void {
    this.seleccionado = p;
    this.personaQuery.setValue(p, { emitEvent: false }); // objeto, no string
  }

  limpiarSeleccion(): void {
    this.seleccionado = undefined;
    this.personaQuery.setValue('', { emitEvent: true }); // vuelve a modo texto
  }

  // Agregar miembro
  agregar(): void {
    if (!this.seleccionado) return;

    this.guardando = true;
    const ROL_ID_POR_DEFECTO = 0;

    this.liderazgoSvc
      .agregarMiembro(this.liderazgoId, this.seleccionado.id, this.rolBaseId ?? ROL_ID_POR_DEFECTO)
      .subscribe({
        next: () => {
          this.guardando = false;
          Swal.fire('Éxito', 'Miembro agregado correctamente', 'success');
          this.limpiarSeleccion();
          this.cargarMiembros();
        },
        error: () => {
          this.guardando = false;
          Swal.fire('Error', 'El miembro ya se encuentra en el ministerio', 'error');
        },
      });
  }

  // Quitar miembro
  quitar(miembroId: number): void {
    Swal.fire({
      title: '¿Quitar miembro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar',
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.liderazgoSvc.eliminarMiembro(this.liderazgoId, miembroId).subscribe({
        next: () => {
          this.miembros = this.miembros.filter((m) => m.id !== miembroId);
          Swal.fire('Eliminado', 'Miembro quitado del ministerio', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo quitar el miembro', 'error'),
      });
    });
  }

  trackByMiembro(_: number, m: Miembro): number {
    return m.id;
  }

  regresar(): void {
    this.router.navigate(['/planificacion']);
  }
}
