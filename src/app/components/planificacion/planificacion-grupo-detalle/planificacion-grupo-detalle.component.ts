import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
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
  styleUrls: ['./planificacion-grupo-detalle.component.scss']
})
export class PlanificacionGrupoDetalleComponent implements OnInit {
  liderazgoId!: number;
  liderazgoNombre = '';

  // Tabs en la misma pantalla
  tabActivo: 'integrantes' | 'eventos' = 'integrantes';

  // Buscar/Agregar integrantes
  personaQuery = new FormControl('');
  resultados$!: Observable<PersonaMini[]>;
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

    // Autocomplete: resultados tipados a PersonaMini[]
    this.resultados$ = this.personaQuery.valueChanges.pipe(
      debounceTime(300),
      switchMap((v: any) => {
        const q = (v ?? '').trim();
        if (q.length < 2) return of([] as PersonaMini[]);
        return this.miembrosSvc.buscarMin$(q);
      })
    );

    // Obtener rol "miembro" del liderazgo
    this.liderazgoSvc.listarRoles(this.liderazgoId).subscribe({
      next: (roles) => {
        if (roles && roles.length) {
          const rMiembro = roles.find(r => (r.nombre || '').toLowerCase().trim() === 'miembro');
          this.rolBaseId = rMiembro?.id ?? roles[0].id;
        } else {
          this.rolBaseId = null;
        }
      },
      error: () => {
        this.rolBaseId = null;
      }
    });

    this.resultados$ = this.personaQuery.valueChanges.pipe(
    debounceTime(300),
    switchMap((v: any) => {
      const q = ((v ?? '') as string).trim();

      // Si borraron el input, limpiamos la selección
      if (!q) {
        this.seleccionado = undefined;
      }

      if (q.length < 2) return of([] as PersonaMini[]);
      return this.miembrosSvc.buscarMin$(q);
    })
  );
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
          nombre: r.nombre ?? r.nombrePersona ?? r.miembroNombre ?? r.persona ?? ''
        }));
        this.cargandoMiembros = false;
      },
      error: () => {
        this.miembros = [];
        this.cargandoMiembros = false;
      }
    });
  }

  // Selección desde la lista de resultados
  elegir(p: PersonaMini): void {
    this.seleccionado = p;
    this.personaQuery.setValue(p.nombre, { emitEvent: false });
  }

  limpiarSeleccion(): void {
    this.seleccionado = undefined;
    this.personaQuery.setValue('', { emitEvent: true });
  }

  // Agregar miembro
  agregar(): void {
    if (!this.seleccionado) return;
    this.guardando = true;
    const ROL_ID_POR_DEFECTO = 0;

    this.liderazgoSvc.agregarMiembro(this.liderazgoId, this.seleccionado.id, this.rolBaseId ?? ROL_ID_POR_DEFECTO).subscribe({
      next: () => {
        this.guardando = false;
        Swal.fire('Éxito', 'Miembro agregado correctamente', 'success');
        this.limpiarSeleccion();
        this.cargarMiembros();
      },
      error: () => {
        this.guardando = false;
        Swal.fire('Error', 'El miembro ya se encuentra en el ministerio', 'error');
      }
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
      cancelButtonText: 'Cancelar'
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.liderazgoSvc.eliminarMiembro(this.liderazgoId, miembroId).subscribe({
        next: () => {
          this.miembros = this.miembros.filter(m => m.id !== miembroId);
          Swal.fire('Eliminado', 'Miembro quitado del ministerio', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo quitar el miembro', 'error')
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
