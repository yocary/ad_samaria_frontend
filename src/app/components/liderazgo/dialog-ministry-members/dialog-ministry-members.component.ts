import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { debounceTime, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

import { LiderazgoService, LiderazgoMiembro } from 'src/app/services/liderazgo.service';
import { PersonasService, PersonaMini } from 'src/app/services/personas.service';

@Component({
  selector: 'app-dialog-ministry-members',
  templateUrl: './dialog-ministry-members.component.html',
  styleUrls: ['./dialog-ministry-members.component.scss']
})
export class DialogMinistryMembersComponent implements OnInit {
  liderazgoId!: number;

  // Listado
  miembros: LiderazgoMiembro[] = [];
  displayedColumns = ['persona','rol','desde','acciones'];

  // Agregar integrante
  personaCtrl = new FormControl('');
  filteredPeople$: Observable<PersonaMini[]> = of([]);
  selectedPerson: PersonaMini | null = null;

  rolCtrl = new FormControl(null);
  roles: { id: number; nombre: string }[] = []; // si sólo devuelves nombre, rellenamos ids locales
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

  private cargarMiembros() {
    this.cargando = true;
    this.lsvc.listarMiembros(this.liderazgoId).subscribe({
      next: list => { this.miembros = list; this.cargando = false; },
      error: _ => { this.cargando = false; }
    });
  }

  private cargarRoles() {
    // si tu API devuelve solo string[], generamos ids locales
    this.lsvc.listarRoles(this.liderazgoId).subscribe(names => {
      this.roles = names.map((n, i) => ({ id: i + 1, nombre: n }));
      if (this.roles.length) this.rolCtrl.setValue(this.roles[0].id);
    });
  }

  selectPerson(p: PersonaMini) {
    this.selectedPerson = p;
    this.personaCtrl.setValue(`${p.nombre} (${p.id})`, { emitEvent: false });
  }

  agregar() {
    if (!this.selectedPerson || !this.rolCtrl.value || !this.fechaCtrl.value) return;
    // Nota: en backend el rol espera rolId real; si solo devuelves nombres,
    // actualiza tu endpoint para regresar {id,nombre}. Aquí dejamos la llamada tal cual:
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

  desactivar(row: LiderazgoMiembro) {
    this.lsvc.desactivarMiembro(row.id).subscribe(() => this.cargarMiembros());
  }

  cerrar() { this.dialogRef.close(); }
}
