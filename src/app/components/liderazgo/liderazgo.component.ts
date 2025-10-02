import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime } from 'rxjs/operators';

import { LiderazgoService, Ministry } from 'src/app/services/liderazgo.service';
import { DialogMinistryMembersComponent } from './dialog-ministry-members/dialog-ministry-members.component';
import { DialogEditMinistryComponent } from './dialog-edit-ministry/dialog-edit-ministry.component';

@Component({
  selector: 'app-liderazgo',
  templateUrl: './liderazgo.component.html',
  styleUrls: ['./liderazgo.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LiderazgoComponent implements OnInit {
  ministries: Ministry[] = [];
  filtered: Ministry[] = [];

  search = new FormControl('');
  newMinistry = new FormControl('');

  constructor(private svc: LiderazgoService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.svc.ministries$.subscribe(list => {
      this.ministries = list;
      this.applyFilter();
    });
    this.search.valueChanges.pipe(debounceTime(150)).subscribe(() => this.applyFilter());
  }

  private applyFilter() {
    const q = (this.search.value || '').toLowerCase().trim();
    this.filtered = q ? this.ministries.filter(m => m.name.toLowerCase().includes(q)) : this.ministries.slice();
  }

  addMinistry() {
    const name = (this.newMinistry.value || '').trim();
    if (!name) return;
    this.svc.addMinistry(name);
    this.newMinistry.reset();
    this.applyFilter();
  }

  openMembers(ministry: Ministry) {
    this.dialog.open(DialogMinistryMembersComponent, {
      width: '980px',
      maxWidth: '98vw',
      disableClose: true,
      data: { ministry }
    });
  }

  openEdit(ministry: Ministry) {
    this.dialog.open(DialogEditMinistryComponent, {
      width: '560px',
      disableClose: true,
      data: { ministry }
    });
  }

  remove(id: number) {
    this.svc.removeMinistry(id);
  }
}
