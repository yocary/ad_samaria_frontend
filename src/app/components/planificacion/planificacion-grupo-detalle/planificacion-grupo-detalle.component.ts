import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith, switchMap, map } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { LiderazgoService } from 'src/app/services/liderazgo.service';
import { PersonasService, PersonaMini } from 'src/app/services/personas.service';
import { MiembrosService } from 'src/app/services/miembros.service';

interface Miembro {
  id: number;        // id del vínculo (liderazgo_miembro, etc.)
  personaId: number;
  nombre: string;
}

@Component({
  selector: 'app-planificacion-grupo-detalle',
  templateUrl: './planificacion-grupo-detalle.component.html',
  styleUrls: ['./planificacion-grupo-detalle.component.scss']
})
export class PlanificacionGrupoDetalleComponent implements OnInit {

  liderazgoId!: number;
  liderazgoNombre = 'Liderazgo';

  cargandoMiembros = true;
  miembros: Miembro[] = [];

  // buscador
  personaQuery: FormControl = new FormControl('');
  resultados$: Observable<PersonaMini[]> = of([]);
  seleccionado: PersonaMini | null = null;

  guardando = false;

  // rol base para asociar (se obtiene de listarRoles)
  private rolBaseId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private liderazgoSvc: LiderazgoService,
    private personasSvc: PersonasService,
    private miembrosService: MiembrosService
  ) {}

  ngOnInit(): void {
    this.liderazgoId = Number(this.route.snapshot.paramMap.get('id'));
    const qpNombre = this.route.snapshot.queryParamMap.get('nombre');
    if (qpNombre) this.liderazgoNombre = qpNombre;

    if (!this.liderazgoId) {
      Swal.fire('Aviso', 'No se recibió el liderazgo.', 'warning');
      this.router.navigate(['/planificacion']);
      return;
    }

    // cargar integrantes
    this.cargarMiembros();

    // obtener rol base (preferimos el que se llame "Miembro")
    this.liderazgoSvc.listarRoles(this.liderazgoId).subscribe({
      next: (roles) => {
        if (roles && roles.length) {
          const rMiembro = roles.find(r => (r.nombre || '').toLowerCase().trim() === 'miembro');
          this.rolBaseId = (rMiembro?.id ?? roles[0].id);
        } else {
          this.rolBaseId = null;
        }
      },
      error: () => {
        this.rolBaseId = null;
      }
    });

    // buscador -> usa PersonasService.buscarMin$(q)
    this.resultados$ = this.personaQuery.valueChanges.pipe(
      startWith('' as string),
      debounceTime(250),
      distinctUntilChanged(),
      switchMap((txt: string) => {
        const q = (txt || '').trim();
        if (q.length < 2) return of<PersonaMini[]>([]);
        return this.miembrosService.buscarMin$(q); // <-- tu servicio existente
      }),
      map(list => list ?? [])
    );
  }

  cargarMiembros(): void {
    this.cargandoMiembros = true;
    this.liderazgoSvc.listarMiembros(this.liderazgoId).subscribe({
      next: (res: any[]) => {
        // res podría ser MiembroRol[]; normalizamos a {id, personaId, nombre}
        this.miembros = (res || []).map(r => ({
          id: Number(r.id),
          personaId: Number(r.personaId),
          nombre: (r.nombre ?? r.nombrePersona ?? r.miembro ?? '').toString()
        }));
        this.cargandoMiembros = false;
      },
      error: () => {
        this.cargandoMiembros = false;
        Swal.fire('Error', 'No se pudieron cargar los integrantes.', 'error');
      }
    });
  }

  // selección desde lista de resultados
  elegir(p: PersonaMini) {
    this.seleccionado = p;
    this.personaQuery.setValue(p.nombre, { emitEvent: false });
  }
  limpiarSeleccion() {
    this.seleccionado = null;
    this.personaQuery.setValue('', { emitEvent: true });
  }

  agregar(): void {
    if (!this.seleccionado) {
      Swal.fire('Validación', 'Selecciona una persona de la lista.', 'info');
      return;
    }
    if (this.rolBaseId == null) {
      Swal.fire('Error', 'No hay un rol base disponible para este liderazgo.', 'error');
      return;
    }

    // no duplicar
    const existe = this.miembros.some(m => m.personaId === this.seleccionado!.id);
    if (existe) {
      Swal.fire('Aviso', 'Esta persona ya pertenece a este liderazgo.', 'info');
      return;
    }

    this.guardando = true;
    this.liderazgoSvc
      .agregarMiembro(this.liderazgoId, this.seleccionado.id, this.rolBaseId)
      .subscribe({
        next: () => {
          this.guardando = false;
          this.limpiarSeleccion();
          this.cargarMiembros();
          Swal.fire('Listo', 'Miembro agregado al liderazgo.', 'success');
        },
        error: (err) => {
          this.guardando = false;
          const status = err?.status;
          const msg: string = err?.error?.message || err?.error || '';
          if (status === 409 || (typeof msg === 'string' && msg.toLowerCase().includes('ya'))) {
            Swal.fire('Duplicado', 'La persona ya estaba asociada al liderazgo.', 'info');
          } else {
            Swal.fire('Error', 'No se pudo agregar el miembro.', 'error');
          }
        }
      });
  }

  quitar(miembroId: number): void {
    Swal.fire({
      title: 'Confirmar',
      text: '¿Quitar este integrante del liderazgo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    }).then(res => {
      if (!res.isConfirmed) return;

      this.liderazgoSvc.eliminarMiembro(this.liderazgoId, miembroId).subscribe({
        next: () => {
          this.cargarMiembros();
          Swal.fire('Listo', 'Integrante quitado.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo quitar el integrante.', 'error')
      });
    });
  }

  regresar(): void {
    this.router.navigate(['/planificacion']);
  }

  trackByMiembro(_i: number, m: Miembro) { return m.id; }
}
