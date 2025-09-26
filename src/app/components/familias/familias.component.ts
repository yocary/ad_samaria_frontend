import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms'; 
import { debounceTime } from 'rxjs/operators';
import { DialogAddFamilyComponent } from '../dialog-add-family/dialog-add-family.component';
import { DialogEditFamilyComponent } from '../dialog-edit-family/dialog-edit-family.component';
import { FamiliesService, Family } from 'src/app/services/families.service';
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
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.families.families$.subscribe(list => (this.data = list));
    this.search.valueChanges.pipe(debounceTime(200)).subscribe(q => {
      this.families.filter(q ?? '');
    });
  }

openAdd(): void {
  this.dialog.open(DialogAddFamilyComponent, { width: '560px', disableClose: true });
}

openEdit(fam: Family): void {
  this.dialog.open(DialogEditFamilyComponent, {
    width: '720px', data: { familyId: fam.id }, disableClose: true
  });
}

  remove(id: number): void {
    this.families.removeFamily(id);
  }
}
