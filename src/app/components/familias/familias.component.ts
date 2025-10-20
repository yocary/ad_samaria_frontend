import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { FamiliesService, Family } from 'src/app/services/families.service';
import { DialogAddFamilyComponent } from '../dialog-add-family/dialog-add-family.component';
import { DialogEditFamilyComponent } from '../dialog-edit-family/dialog-edit-family.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-familias',
  templateUrl: './familias.component.html',
  styleUrls: ['./familias.component.scss']
})
export class FamiliasComponent implements OnInit {
  displayedColumns = ['index', 'name', 'actions'];
  data: Family[] = [];
  search = new FormControl('');

  constructor(
    private families: FamiliesService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.search.valueChanges.pipe(debounceTime(250)).subscribe(q => this.cargar(q ?? ''));
  }

  cargar(q?: string) {
    this.families.listarFamilias(q).subscribe(list => this.data = list);
  }

  openAdd(): void {
    const ref = this.dialog.open(DialogAddFamilyComponent, { width: '560px', disableClose: true });
    ref.afterClosed().subscribe(ok => ok && this.cargar(this.search.value ?? ''));
  }

openEdit(fam: Family): void {
  console.log('Editando familia:', fam); // 👈 para ver en consola
  this.dialog.open(DialogEditFamilyComponent, {
    width: '1000px',
    data: { family: fam },
    disableClose: true
  });
}

  remove(id: number): void {
    if (!confirm('¿Eliminar esta familia?')) return;
    this.families.eliminarFamilia(id).subscribe(() => this.cargar(this.search.value ?? ''));
  }

    regresar(): void {
    this.router.navigate(['/miembros/home']);
  }
}
