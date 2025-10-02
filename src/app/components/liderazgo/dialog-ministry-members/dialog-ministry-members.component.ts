import { LiderazgoService, Ministry, Role, Person, MinistryMember } from './../../../services/liderazgo.service';
import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-dialog-ministry-members',
  templateUrl: './dialog-ministry-members.component.html',
  styleUrls: ['./dialog-ministry-members.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DialogMinistryMembersComponent implements OnInit {
  ministry!: Ministry;

  // Roles
  addRoleName = new FormControl('');
  allMembersFlag = new FormControl(false);
  roles: Role[] = [];

  // Personas
  people: Person[] = [];
  personSelect = new FormControl('');
  members: (MinistryMember & { person?: Person })[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { ministry: Ministry },
    private dialogRef: MatDialogRef<DialogMinistryMembersComponent>,
    private svc: LiderazgoService
  ) {}

  ngOnInit(): void {
    this.ministry = this.data.ministry;

    combineLatest([this.svc.roles$, this.svc.people$, this.svc.members$])
      .subscribe(([roles, people, members]) => {
        this.roles = roles.filter(r => r.ministryId === this.ministry.id);
        this.people = people;
        const mm = members.filter(m => m.ministryId === this.ministry.id);
        this.members = mm.map(m => ({ ...m, person: people.find(p => p.id === m.personId) }));
      });
  }

  // Roles
  addRole() {
    const name = (this.addRoleName.value || '').trim();
    if (!name) return;
    this.svc.addRole(this.ministry.id, name);
    this.addRoleName.reset();
  }
  editRole(r: Role) {
    const name = prompt('Nuevo nombre del rol', r.name);
    if (name && name.trim()) this.svc.updateRole(r.id, name.trim());
  }
  removeRole(r: Role) {
    this.svc.removeRole(r.id);
  }

  // Personas
  addPerson() {
    const id = Number(this.personSelect.value);
    if (!id) return;
    this.svc.addMember(this.ministry.id, id);
    this.personSelect.reset();
  }
  removePerson(memberId: number) {
    this.svc.removeMember(memberId);
  }

  close(){ this.dialogRef.close(); }
}
