import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

import { LiderazgoService, MiembroRol, Rol, PersonaLite } from 'src/app/services/liderazgo.service';
import { PersonasService } from 'src/app/services/personas.service';

@Component({
  selector: 'app-dialog-ministry-members',
  templateUrl: './dialog-ministry-members.component.html',
  styleUrls: ['./dialog-ministry-members.component.scss']
})
export class DialogMinistryMembersComponent implements OnInit {
  // viene del open(..., { data: { liderazgoId }})
  liderazgoId!: number;

  // Tabla
  miembros: MiembroRol[] = [];
  displayedColumns = ['persona','rol','desde','acciones'];

  // Agregar integrante
  personaCtrl = new FormControl('');
  filteredPeople$: Observable<PersonaLite[]> = of([]);
  selectedPerson: PersonaLite | null = null;

rolCtrl = new FormControl(null);
  roles: Rol[] = [];
  fechaCtrl = new FormControl(''); // yyyy-MM-dd

  cargando = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { liderazgoId: number },
    private dialogRef: MatDialogRef<DialogMinistryMembersComponent>,
    private lsvc: LiderazgoService,
    private personas: PersonasService
  ) {}

  ngOnInit(): void {
    this.liderazgoId = this.data.liderazgoId;
    this.cargarMiembros();
    this.cargarRoles();

    // Autocomplete personas
    this.filteredPeople$ = this.personaCtrl.valueChanges.pipe(
      debounceTime(200),
      switchMap(q => {
        const text = (q || '').toString().trim();
        return text.length < 2 ? of([]) : this.personas.buscar(text);
      })
    );
  }

  private cargarMiembros(): void {
    this.cargando = true;
    this.lsvc.listarMiembros(this.liderazgoId).subscribe({
      next: list => { this.miembros = list; this.cargando = false; },
      error: _ => { this.cargando = false; }
    });
  }

  private cargarRoles(): void {
    this.lsvc.listarRoles(this.liderazgoId).subscribe({
      next: roles => {
        this.roles = roles;
        if (this.roles.length) this.rolCtrl.setValue(this.roles[0].id);
      }
    });
  }

  selectPerson(p: PersonaLite): void {
    this.selectedPerson = p;
    this.personaCtrl.setValue(`${p.nombre}`, { emitEvent: false });
  }

  agregar(): void {
    if (!this.selectedPerson || !this.rolCtrl.value || !this.fechaCtrl.value) return;
    this.lsvc.agregarMiembro(this.liderazgoId, this.selectedPerson.id, this.rolCtrl.value, this.fechaCtrl.value)
      .subscribe({
        next: () => {
          this.selectedPerson = null;
          this.personaCtrl.reset('');
          this.fechaCtrl.reset('');
          this.cargarMiembros();
        }
      });
  }

  // 🔧 Este método faltaba y es el que usa el template (desactivar)
  desactivar(m: MiembroRol): void {
    if (!confirm(`¿Desactivar a ${m.nombrePersona}?`)) return;
    this.lsvc.eliminarMiembro(this.liderazgoId, m.id).subscribe({
      next: () => this.cargarMiembros()
    });
  }

  cerrar(): void { this.dialogRef.close(); }
}
