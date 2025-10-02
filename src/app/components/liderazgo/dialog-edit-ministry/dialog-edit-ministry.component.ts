import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import { LiderazgoService, Ministry } from './../../../services/liderazgo.service';

@Component({
  selector: 'app-dialog-edit-ministry',
  templateUrl: './dialog-edit-ministry.component.html',
  styleUrls: ['./dialog-edit-ministry.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DialogEditMinistryComponent {
  name = new FormControl('', Validators.required);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { ministry: Ministry },
    private dialogRef: MatDialogRef<DialogEditMinistryComponent>,
    private svc: LiderazgoService
  ){
    this.name.setValue(data.ministry.name);
  }

  save(){
    const v = (this.name.value || '').trim();
    if (!v) return;
    this.svc.updateMinistry(this.data.ministry.id, v);
    this.dialogRef.close(true);
  }
  cancel(){ this.dialogRef.close(); }
}
