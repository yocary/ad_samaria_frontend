import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { MiembrosService } from 'src/app/services/miembros.service';
import { LiderazgoService } from 'src/app/services/liderazgo.service';
import { PersonasService, PersonaMini } from 'src/app/services/personas.service';

interface MiembroAsociado {
  id: number;
  personaId: number;
  nombre: string;
}

@Component({
  selector: 'app-planificacion-grupo-integrantes',
  templateUrl: './planificacion-grupo-integrantes.component.html',
  styleUrls: ['./planificacion-grupo-integrantes.component.scss']
})
export class PlanificacionGrupoIntegrantesComponent implements OnInit {
  liderazgoId!: number;
  nombreGrupo = '';

  cargando = true;
  integrantes: MiembroAsociado[] = [];

  // búsqueda
  personaQuery = new FormControl('');
  resultados$: Observable<PersonaMini[]> = of([]);
  seleccionado: PersonaMini | null = null;
  agregando = false;

  constructor(
    private route: ActivatedRoute,
    private miembrosSvc: MiembrosService,
    private lidSvc: LiderazgoService,
    private personaSvc: PersonasService,
  ) {}

  ngOnInit(): void {
    this.liderazgoId = Number(this.route.snapshot.paramMap.get('id'));
    this.nombreGrupo = this.route.snapshot.queryParamMap.get('nombre') || 'Grupo';
    this.cargarIntegrantes();
    this.setupBusqueda();
  }

  private setupBusqueda() {
    this.resultados$ = this.personaQuery.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => q && q.length >= 2 ? this.miembrosSvc.buscarMin$(q) : of([]))
    );
  }

  private cargarIntegrantes() {
    this.cargando = true;
    this.lidSvc.listarMiembros(this.liderazgoId).subscribe({
      next: (res) => {
        // Map incoming MiembroRol[] (which may lack `nombre`) to MiembroAsociado[]
        this.integrantes = (res || []).map((r: any) => ({
          id: r.id,
          personaId: r.personaId ?? r.persona?.id ?? 0,
          nombre: r.nombre ?? r.persona?.nombre ?? ''
        }));
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        Swal.fire('Error', 'No se pudieron cargar los integrantes.', 'error');
      }
    });
  }

  seleccionarPersona(p: PersonaMini) {
    this.seleccionado = p;
    this.personaQuery.setValue(p.nombre, { emitEvent: false });
  }

  agregarMiembro() {
    if (!this.seleccionado) {
      Swal.fire('Atención', 'Selecciona un miembro válido.', 'warning');
      return;
    }

    const existe = this.integrantes.some(m => m.personaId === this.seleccionado!.id);
    if (existe) {
      Swal.fire('Aviso', 'Esta persona ya pertenece al grupo.', 'info');
      return;
    }

    this.agregando = true;
    // agregarMiembro espera (liderazgoId, personaId, rolId) — usar rolId por defecto 0 cuando no hay selección de rol
    this.lidSvc.agregarMiembro(this.liderazgoId, this.seleccionado.id, 0).subscribe({
      next: () => {
        this.agregando = false;
        Swal.fire('Agregado', 'Miembro asociado correctamente.', 'success');
        this.seleccionado = null;
        this.personaQuery.setValue('');
        this.cargarIntegrantes();
      },
      error: () => {
        this.agregando = false;
        Swal.fire('Error', 'No se pudo asociar el miembro.', 'error');
      }
    });
  }

  eliminarMiembro(m: MiembroAsociado) {
    Swal.fire({
      title: '¿Quitar integrante?',
      text: `¿Deseas eliminar a ${m.nombre} de este grupo?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.lidSvc.eliminarMiembro(m.id, 0).subscribe({
        next: () => {
          Swal.fire('Eliminado', 'Miembro eliminado correctamente.', 'success');
          this.cargarIntegrantes();
        },
        error: () => Swal.fire('Error', 'No se pudo eliminar el miembro.', 'error')
      });
    });
  }
}
