import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { FamiliesService } from 'src/app/services/families.service';

@Component({
  selector: 'app-dialog-add-family',
  templateUrl: './dialog-add-family.component.html',
  styleUrls: ['./dialog-add-family.component.scss']
})
export class DialogAddFamilyComponent {
  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
  });

  constructor(
    private fb: FormBuilder,
    private families: FamiliesService,
    private ref: MatDialogRef<DialogAddFamilyComponent>
  ) {}

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.families.addFamily(this.form.value.name!);
    this.ref.close(true);
  }

  cancel(): void { this.ref.close(); }
}
