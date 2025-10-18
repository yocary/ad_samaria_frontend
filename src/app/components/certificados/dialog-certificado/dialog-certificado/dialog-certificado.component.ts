import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

// Mantengo tu import tal cual lo tienes en tu proyecto (personas mock)
import { CertificadosService } from 'src/app/services/certificado.service';

// 👉 nuevo: servicio HTTP real al backend
import {
  CertificadosApiService,
} from 'src/app/services/certificados-api.service';

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
  private typeSub?: Subscription;          // <- SOLO para cambios de tipo
  private toggleSubs: Subscription[] = []; // <- para radios Sí/No

  // 👉 mapa de tipos → id en tu tabla tipo_certificado (ajusta a tus IDs reales)
  private tipoIdMap: Record<string, number> = {
    'Membresía': 1,
    'Presentación de Niños': 2,
    'Bautismo': 3,
    'Matrimonio': 4
  };

  constructor(
    private dialogRef: MatDialogRef<DialogCertificadoComponent>,
    private certSvc: CertificadosService,          // lo mantengo por si lo usas
    private api: CertificadosApiService            // <-- se usa para guardar en backend
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
    memberName: new FormControl('', Validators.required),
    issueDate:  new FormControl('', Validators.required),
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

  // ====== Helpers ======
  private toIso(d: any): string {
    if (!d) return '';
    if (d instanceof Date) {
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${d.getFullYear()}-${m}-${day}`;
    }
    // Si ya viene "yyyy-MM-dd", lo dejo igual
    return String(d);
  }

  private nombrePersona(id?: number): string {
    const p = this.people.find(x => x.id === id);
    return p ? p.name : '';
  }

  // ====== Guardar (crea el registro en BD) ======
  save(): void {
    if (!this.form) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const tipo = this.currentType;
    const tipoId = this.tipoIdMap[tipo] ?? 0; // ajusta IDs reales

    const v = this.form.getRawValue();

    // Campos base de certificado (según diseño de tu tabla)
    let miembroId: number | null = null;
    let pastorId: number | null = null;
    let fechaIso = this.toIso(v.issueDate);

    // EXTRAS que van al JRXML (ajusta claves a las que tu backend espera)
    const extras: Record<string, string> = {};

if (tipo === 'Membresía') {
  const nombreMiembro = v.memberName;
  const fechaIso = this.toIso(v.issueDate);

  // 1️⃣ Guardar en BD
  this.api.crearMembresiaCertificado({ nombreMiembro, fecha: fechaIso }).subscribe({
    next: () => {
      // 2️⃣ Luego generar el PDF
      this.api.generarMembresiaPdf({ nombreMiembro, fecha: fechaIso }).subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Certificado Membresía - ${nombreMiembro}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
          Swal.fire('Éxito', 'Certificado creado y descargado', 'success');
          this.dialogRef.close(true);
        },
        error: () => Swal.fire('Error', 'No se pudo generar el PDF', 'error')
      });
    },
    error: () => Swal.fire('Error', 'No se pudo guardar el certificado', 'error')
  });
}
 else if (tipo === 'Bautismo') {
      miembroId = Number(v.memberId);
      pastorId = Number(v.pastorId);
      extras['OTORGADO_A'] = this.nombrePersona(v.memberId);
      extras['PASTOR'] = this.nombrePersona(v.pastorId);
      extras['FECHA_BAUTISMO'] = this.toIso(v.baptismDate);
      extras['FECHA_EXPEDICION'] = fechaIso;

    } else if (tipo === 'Presentación de Niños') {
      pastorId = Number(v.pastorId);
      // miembroId: si alguno de los padres es miembro, lo usamos como "miembro principal"
      if (v.fatherIsMember && v.fatherId) miembroId = Number(v.fatherId);
      else if (v.motherIsMember && v.motherId) miembroId = Number(v.motherId);
      else miembroId = pastorId; // fallback si tu BD exige NOT NULL (ajústalo si permites null)

      extras['OTORGADO_A'] = String(v.childName || '');
      extras['PADRE'] = v.fatherIsMember ? this.nombrePersona(v.fatherId) : '';
      extras['MADRE'] = v.motherIsMember ? this.nombrePersona(v.motherId) : '';
      extras['PASTOR'] = this.nombrePersona(v.pastorId);
      extras['LUGAR_FECHA_NAC'] = this.toIso(v.childBirthDate);
      extras['TESTIGO'] = String(v.witnessName || '');
      extras['FECHA_EXPEDICION'] = fechaIso;

    } else if (tipo === 'Matrimonio') {
      pastorId = Number(v.pastorId);
      // miembroId: elegimos esposo si es miembro; si no, esposa; si no, pastor (si tu BD exige NOT NULL)
      if (v.husbandIsMember && v.husbandId) miembroId = Number(v.husbandId);
      else if (v.wifeIsMember && v.wifeId) miembroId = Number(v.wifeId);
      else miembroId = pastorId;

      extras['PAREJA_A'] = v.husbandIsMember ? this.nombrePersona(v.husbandId) : '';
      extras['PAREJA_B'] = v.wifeIsMember ? this.nombrePersona(v.wifeId) : '';
      extras['PASTOR'] = this.nombrePersona(v.pastorId);
      extras['FECHA_EXPEDICION'] = fechaIso;
    }




  }

  cancel(): void { this.dialogRef.close(false); }

  ngOnDestroy(): void {
    this.clearToggleSubs();
    this.typeSub?.unsubscribe();
  }
}
