import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

// Mantengo tu import tal cual lo tienes en tu proyecto
import { CertificadosService } from 'src/app/services/certificado.service';

@Component({
  selector: 'app-dialog-certificado',
  templateUrl: './dialog-certificado.component.html',
  styleUrls: ['./dialog-certificado.component.scss']
})
export class DialogCertificadoComponent implements OnInit, OnDestroy {
  types = ['Membresía', 'Presentación de Niños', 'Bautismo', 'Matrimonio'];

  // Control del tipo (fuera del form dinámico)
  typeCtrl = new FormControl('Membresía');
  currentType = 'Membresía';

  form: FormGroup | null = null;

  // Mock de personas (reemplaza con tus datos reales si aplica)
  people = [
    { id: 1, name: 'Juan Pérez' },
    { id: 2, name: 'María López' },
    { id: 3, name: 'Carlos Gómez' },
    { id: 4, name: 'Pastor Luis' },
  ];

  // Suscripciones separadas
  private typeSub?: Subscription;         // <- SOLO para cambios de tipo
  private toggleSubs: Subscription[] = []; // <- para radios Sí/No

  constructor(
    private dialogRef: MatDialogRef<DialogCertificadoComponent>,
    private certSvc: CertificadosService
  ) {}

  ngOnInit(): void {
    // Inicial
    this.currentType = this.typeCtrl.value || 'Membresía';
    this.buildForm(this.currentType);

    // Muy importante: esta suscripción NO se limpia en buildForm
    this.typeSub = this.typeCtrl.valueChanges.subscribe(v => {
      this.currentType = v || 'Membresía';
      this.buildForm(this.currentType);
    });
  }

  private buildForm(type: string): void {
    this.clearToggleSubs(); // limpia SOLO las subs de toggles (no la del tipo)

    switch (type) {
      case 'Membresía':
        this.form = new FormGroup({
          memberId:  new FormControl(null, Validators.required),
          pastorId:  new FormControl(null, Validators.required),
          issueDate: new FormControl('', Validators.required),
        });
        break;

      case 'Bautismo':
        this.form = new FormGroup({
          baptismDate: new FormControl('', Validators.required),
          memberId:    new FormControl(null, Validators.required),
          pastorId:    new FormControl(null, Validators.required),
          issueDate:   new FormControl('', Validators.required),
        });
        break;

      case 'Presentación de Niños':
        this.form = new FormGroup({
          childName:       new FormControl('', Validators.required),
          childBirthDate:  new FormControl('', Validators.required),

          fatherIsMember:  new FormControl(true),
          fatherId:        new FormControl(null),

          motherIsMember:  new FormControl(true),
          motherId:        new FormControl(null),

          pastorId:        new FormControl(null, Validators.required),
          witnessName:     new FormControl(''),

          issueDate:       new FormControl('', Validators.required),
        });
        this.setupChildMemberToggles();
        break;

      case 'Matrimonio':
        this.form = new FormGroup({
          husbandIsMember: new FormControl(true),
          husbandId:       new FormControl(null),

          wifeIsMember:    new FormControl(true),
          wifeId:          new FormControl(null),

          pastorId:        new FormControl(null, Validators.required),
          issueDate:       new FormControl('', Validators.required),
        });
        this.setupMarriageMemberToggles();
        break;

      default:
        this.form = new FormGroup({
          issueDate: new FormControl('', Validators.required),
        });
        break;
    }
  }

  // ===== toggles Presentación =====
  private setupChildMemberToggles(): void {
    if (!this.form) return;
    const fFlag = this.form.get('fatherIsMember');
    const fSel  = this.form.get('fatherId');
    const mFlag = this.form.get('motherIsMember');
    const mSel  = this.form.get('motherId');
    if (!fFlag || !fSel || !mFlag || !mSel) return;

    const apply = () => {
      const isF = !!fFlag.value;
      if (!isF) { fSel.reset(); fSel.disable(); fSel.clearValidators(); }
      else { fSel.enable(); fSel.setValidators([Validators.required]); }
      fSel.updateValueAndValidity({ emitEvent: false });

      const isM = !!mFlag.value;
      if (!isM) { mSel.reset(); mSel.disable(); mSel.clearValidators(); }
      else { mSel.enable(); mSel.setValidators([Validators.required]); }
      mSel.updateValueAndValidity({ emitEvent: false });
    };

    apply();
    this.toggleSubs.push(fFlag.valueChanges.subscribe(apply));
    this.toggleSubs.push(mFlag.valueChanges.subscribe(apply));
  }

  // ===== toggles Matrimonio =====
  private setupMarriageMemberToggles(): void {
    if (!this.form) return;
    const hFlag = this.form.get('husbandIsMember');
    const hSel  = this.form.get('husbandId');
    const wFlag = this.form.get('wifeIsMember');
    const wSel  = this.form.get('wifeId');
    if (!hFlag || !hSel || !wFlag || !wSel) return;

    const apply = () => {
      const isH = !!hFlag.value;
      if (!isH) { hSel.reset(); hSel.disable(); hSel.clearValidators(); }
      else { hSel.enable(); hSel.setValidators([Validators.required]); }
      hSel.updateValueAndValidity({ emitEvent: false });

      const isW = !!wFlag.value;
      if (!isW) { wSel.reset(); wSel.disable(); wSel.clearValidators(); }
      else { wSel.enable(); wSel.setValidators([Validators.required]); }
      wSel.updateValueAndValidity({ emitEvent: false });
    };

    apply();
    this.toggleSubs.push(hFlag.valueChanges.subscribe(apply));
    this.toggleSubs.push(wFlag.valueChanges.subscribe(apply));
  }

  private clearToggleSubs(): void {
    this.toggleSubs.forEach(s => s.unsubscribe());
    this.toggleSubs = [];
  }

  save(): void {
    if (!this.form) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const payload = { type: this.currentType, ...this.form.getRawValue() };
    console.log('Certificado guardado:', payload);
    this.dialogRef.close(true);
  }

  cancel(): void { this.dialogRef.close(false); }

  ngOnDestroy(): void {
    this.clearToggleSubs();
    this.typeSub?.unsubscribe();
  }
}
