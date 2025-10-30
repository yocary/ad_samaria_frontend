import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { FinanzasService } from 'src/app/services/finanzas.service';
import { Movement, Treasury } from 'src/app/models/finanzas.model';
import { DialogMovementComponent } from '../dialog-movement/dialog-movement.component';

type TabKey = 'mov' | 'cat' | 'users' | 'edit';

@Component({
  selector: 'app-dialog-treasury-detail',
  templateUrl: './dialog-treasury-detail.component.html',
  styleUrls: ['./dialog-treasury-detail.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DialogTreasuryDetailComponent implements OnInit, OnDestroy {

  /* ---------- Tabs ---------- */
  selectedIndex = 0;
  tabs: { key: TabKey; label: string }[] = [
    { key: 'mov',   label: 'Movimientos' },
    { key: 'cat',   label: 'Categorías' },
    { key: 'users', label: 'Administrar Usuarios' },
    { key: 'edit',  label: 'Editar Tesorería' },
  ];

  treasury?: Treasury | null;
  treasuryId!: number;

  /* ---------- MOVIMIENTOS ---------- */
  searchMov = new FormControl('');
  movements: Movement[] = [];
  kpiIngresos = 0;
  kpiEgresos  = 0;
  kpiSaldo    = 0;

  /** Periodo actual del backend ('mes' | 'mes_anterior' | 'anio' | 'todos') */
  private currentPeriod: 'mes'|'mes_anterior'|'anio'|'todos' = 'mes';

  /* ---------- CATEGORÍAS (mock por ahora) ---------- */
  catName = new FormControl('');
  catType = new FormControl(''); // 'Ingreso' | 'Egreso'
  catList: Array<{
    id: number;
    name: string;
    type: 'Ingreso'|'Egreso';
    editing?: boolean;
    _name?: string;
    _type?: 'Ingreso'|'Egreso';
  }> = [
    { id: 1, name: 'Ofrenda Jóvenes', type: 'Egreso'  },
    { id: 2, name: 'Diezmos',         type: 'Ingreso' }
  ];
  private catIdSeq = 3;

  /* ---------- USUARIOS (mock por ahora) ---------- */
  userRoles = ['Administrador', 'Tesorero', 'Revisor', 'Lector'];
  users: { id:number; name:string; email:string; role:string }[] = [
    { id: 1, name: 'Nombre usuario', email: 'usuario@e.com.gt', role: 'Administrador' }
  ];
  userName = new FormControl('');
  userEmail = new FormControl('');
  userRole  = new FormControl('');
  userEditing = false;
  private editingId: number|null = null;

  /* ---------- EDIT TESORERÍA ---------- */
  treasuryStatuses = ['Activo', 'Inactivo'];
  currencies = [
    { value: 'GTQ', label: '(GTQ) Guatemala' },
    { value: 'USD', label: '(USD) Dólar' }
  ];
  editForm = new FormGroup({
    name:   new FormControl('', Validators.required),
    status: new FormControl('Activo'),
    currency: new FormControl('GTQ')
  });

  /* ---------- Subs ---------- */
  private subs = new Subscription();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { treasuryId: number },
    private dialogRef: MatDialogRef<DialogTreasuryDetailComponent>,
    private fin: FinanzasService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.treasuryId = this.data.treasuryId;

    // 1) Sincronizar tesorería (del store del servicio si ya está cargada)
    this.subs.add(
      this.fin.treasuries$.subscribe((list: Treasury[]) => {
        this.treasury = list?.find(t => t.id === this.treasuryId) || this.treasury || null;

        if (this.treasury) {
          this.editForm.patchValue({
            name: this.treasury.name,
            status: this.treasury.status,
            currency: (this as any).treasury?.currency || 'GTQ'
          }, { emitEvent: false });
        }
      })
    );

    // 2) Buscar → reconsultar backend con q (debounced)
    this.subs.add(
      this.searchMov.valueChanges.pipe(debounceTime(250)).subscribe(() => {
        this.reloadMovimientos();      // pide al backend con q actual
      })
    );

    // 3) Primera carga: movimientos + resumen
    this.reloadMovimientos();
    this.cargarResumen(this.currentPeriod);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /** Llama al backend para recargar movimientos usando periodo + q actuales */
  private reloadMovimientos(): void {
    this.fin.loadMovimientos(this.treasuryId, {
      periodo: this.currentPeriod,
      q: (this.searchMov.value || '').toString().trim()
    }).subscribe(list => {
      // El backend ya devuelve movimientos de esta tesorería y filtrados por q
      this.movements = list || [];
      this.updateKPIs();
    });
  }

  /** Llama al backend para traer totales de la tesorería y refrescar KPIs */
  private cargarResumen(periodo: 'mes'|'mes_anterior'|'anio'|'todos'): void {
    this.fin.getResumenTesoreria(this.treasuryId, periodo)
      .subscribe(r => {
        this.kpiIngresos = r?.totalIngresos ?? 0;
        this.kpiEgresos  = r?.totalEgresos  ?? 0;
        this.kpiSaldo    = this.kpiIngresos - this.kpiEgresos;
      });
  }

  private updateKPIs() {
    const list = this.movements;
    this.kpiIngresos = list.filter(m => m.type === 'Ingreso').reduce((a, b) => a + (b.amount || 0), 0);
    this.kpiEgresos  = list.filter(m => m.type === 'Egreso').reduce((a, b) => a + (b.amount || 0), 0);
    this.kpiSaldo    = this.kpiIngresos - this.kpiEgresos;
  }

  /** Mapea el select de UI a periodo del backend y recarga */
  periodChanged(v: string){
    const map: Record<string, 'mes'|'mes_anterior'|'anio'|'todos'> = {
      all: 'todos',
      m1:  'mes',
      m3:  'mes_anterior',
      y1:  'anio'
    };
    this.currentPeriod = map[v] || 'mes';
    this.reloadMovimientos();
    this.cargarResumen(this.currentPeriod);
  }

  addMovement() {
    this.dialog.open(DialogMovementComponent, {
      width: '680px',
      disableClose: true,
      data: { treasuryId: this.treasuryId }
    }).afterClosed().subscribe((changed) => {
      if (changed) {
        this.reloadMovimientos();
        this.cargarResumen(this.currentPeriod);
      }
    });
  }

  editMovement(row: Movement){
    this.dialog.open(DialogMovementComponent, {
      width: '680px',
      disableClose: true,
      data: { treasuryId: this.treasuryId, movement: row }
    }).afterClosed().subscribe((changed) => {
      if (changed) {
        this.reloadMovimientos();
        this.cargarResumen(this.currentPeriod);
      }
    });
  }

  deleteMovement(row: Movement){
    // Cuando implementes delete en el servicio, refresca:
    // this.fin.deleteMovement(row.id).subscribe(() => {
    //   this.reloadMovimientos();
    //   this.cargarResumen(this.currentPeriod);
    // });
  }

  download(){ /* TODO: exportar CSV */ }

  /* ===== Categorías (mock) ===== */
  addCategory(): void {
    const name = (this.catName.value || '').trim();
    const type = (this.catType.value || '').trim();
    if (!name || (type !== 'Ingreso' && type !== 'Egreso')) { return; }
    this.catList.push({ id: this.catIdSeq++, name, type: type as any });
    this.catName.reset();
    this.catType.reset();
  }

  startEditCategory(c: any): void {
    c.editing = true;
    c._name = c.name;
    c._type = c.type;
  }

  saveEditCategory(c: any): void {
    const name = (c._name || '').trim();
    const type = c._type;
    if (!name || (type !== 'Ingreso' && type !== 'Egreso')) { return; }
    c.name = name;
    c.type = type;
    c.editing = false;
    delete c._name;
    delete c._type;
  }

  cancelEditCategory(c: any): void {
    c.editing = false;
    delete c._name;
    delete c._type;
  }

  removeCategory(c: any): void {
    this.catList = this.catList.filter(x => x.id !== c.id);
  }

  /* ===== Usuarios (mock) ===== */
  startAddUser(){
    this.editingId = null;
    this.userName.reset();
    this.userEmail.reset();
    this.userRole.reset();
    this.userEditing = true;
  }

  editUser(u: {id:number; name:string; email:string; role:string}){
    this.editingId = u.id;
    this.userName.setValue(u.name);
    this.userEmail.setValue(u.email);
    this.userRole.setValue(u.role);
    this.userEditing = true;
  }

  saveUser(){
    const name = (this.userName.value || '').trim();
    const email = (this.userEmail.value || '').trim();
    const role  = (this.userRole.value  || '').trim();
    if (!name || !email || !role) return;

    if (this.editingId == null) {
      const newId = (this.users.length ? Math.max(...this.users.map(u => u.id)) : 0) + 1;
      this.users.push({ id: newId, name, email, role });
    } else {
      const idx = this.users.findIndex(u => u.id === this.editingId);
      if (idx >= 0) this.users[idx] = { id: this.editingId, name, email, role };
    }

    this.userEditing = false;
    this.editingId = null;
    this.userName.reset(); this.userEmail.reset(); this.userRole.reset();
  }

  cancelUser(){
    this.userEditing = false;
    this.editingId = null;
    this.userName.reset(); this.userEmail.reset(); this.userRole.reset();
  }

  removeUser(id:number){ this.users = this.users.filter(u => u.id !== id); }

  /* ===== Edit Tesorería ===== */
  saveTreasury(){
    if (!this.editForm.valid || !this.treasury) return;

    const name     = (this.editForm.get('name')?.value as string) ?? '';
    const status   = (this.editForm.get('status')?.value as 'Activo'|'Inactivo') ?? 'Activo';
    const currency = (this.editForm.get('currency')?.value as string) ?? 'GTQ';

    // TODO: integra con tu servicio para persistir (y que emita en treasuries$)
    this.treasury.name   = name;
    this.treasury.status = status;
    (this.treasury as any).currency = currency;

    this.dialogRef.close(true);
  }

  deleteTreasury(){
    if (!this.treasury) return;
    // TODO: fin.deleteTreasury(this.treasury.id) y cerrar
    this.dialogRef.close(true);
  }

  close(){ this.dialogRef.close(); }
}
