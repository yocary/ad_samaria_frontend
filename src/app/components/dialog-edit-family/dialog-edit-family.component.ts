import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FamiliesService, Family, FamilyMember } from 'src/app/services/families.service';

@Component({
  selector: 'app-dialog-edit-family',
  templateUrl: './dialog-edit-family.component.html',
  styleUrls: ['./dialog-edit-family.component.scss']
})
export class DialogEditFamilyComponent {
  family?: Family;
  displayedColumns = ['index', 'name', 'role', 'actions'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { familyId: number },
    private families: FamiliesService,
    private ref: MatDialogRef<DialogEditFamilyComponent>
  ){
    this.family = this.families.getById(data.familyId);
  }

  removeMember(m: FamilyMember): void {
    if (!this.family) return;
    this.families.removeMember(this.family.id, m.id);
    this.family = this.families.getById(this.family.id);
  }

  close(): void { this.ref.close(); }
}
