import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

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
  private allMovements: Movement[] = []; // cache desde el servicio
  kpiIngresos = 0;
  kpiEgresos  = 0;
  kpiSaldo    = 0;

  /* ---------- CATEGORÍAS ---------- */
  catName = new FormControl('');
  catType = new FormControl(''); // 'Ingreso' | 'Egreso'
  // Tabla categorías (mock; reemplaza por datos del backend cuando tengas)
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

  /* ---------- USUARIOS ---------- */
  userRoles = ['Administrador', 'Tesorero', 'Revisor', 'Lector'];
  users: { id:number; name:string; email:string; role:string }[] = [
    { id: 1, name: 'Nombre usuario', email: 'usuario@e.com.gt', role: 'Administrador' }
  ];
  userName = new FormControl('');
  userEmail = new FormControl('');
  userRole  = new FormControl('');
  userEditing = false;                 // muestra la fila de alta/edición
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

    // 1) Tesorerías (público)
    this.subs.add(
      this.fin.treasuries$.subscribe((list) => {
        this.treasury = list.find(t => t.id === this.treasuryId) || this.fin.selectedTreasury || null;

        if (this.treasury) {
          this.editForm.patchValue({
            name: this.treasury.name,
            status: this.treasury.status,
            // si tu modelo guarda moneda, setéala aquí
            currency: (this as any).treasury.currency || 'GTQ'
          }, { emitEvent: false });
        }
      })
    );

    // 2) Movimientos (público)
    this.subs.add(
      this.fin.movements$.subscribe((list) => {
        this.allMovements = list;
        this.applyMovementFilters();
      })
    );

    // 3) Filtro de texto
    this.subs.add(
      this.searchMov.valueChanges.subscribe(() => this.applyMovementFilters())
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /* ===== Movimientos ===== */
  private applyMovementFilters(): void {
    const base = this.allMovements.filter(m => m.treasuryId === this.treasuryId);
    const text = ((this.searchMov.value as string) ?? '').toLowerCase().trim();

    this.movements = text
      ? base.filter(m =>
          ((m.concept || '').toLowerCase().includes(text)) ||
          ((m.category || '').toLowerCase().includes(text))
        )
      : base;

    this.updateKPIs();
  }

  private updateKPIs() {
    const list = this.movements;
    this.kpiIngresos = list.filter(m => m.type === 'Ingreso').reduce((a, b) => a + (b.amount || 0), 0);
    this.kpiEgresos  = list.filter(m => m.type === 'Egreso').reduce((a, b) => a + (b.amount || 0), 0);
    this.kpiSaldo    = this.kpiIngresos - this.kpiEgresos;
  }

  addMovement() {
    this.dialog.open(DialogMovementComponent, {
      width: '680px',
      disableClose: true,
      data: { treasuryId: this.treasuryId }
    }).afterClosed().subscribe(); // movements$ refrescará solo
  }

  editMovement(row: Movement){
    this.dialog.open(DialogMovementComponent, {
      width: '680px',
      disableClose: true,
      data: { treasuryId: this.treasuryId, movement: row }
    }).afterClosed().subscribe();
  }

  deleteMovement(row: Movement){
    this.fin.removeMovement(row.id);
  }

  download(){ /* TODO: exportar CSV */ }
  periodChanged(_v: string){ /* TODO: filtrar por periodo */ }

  /* ===== Categorías ===== */
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

  /* ===== Usuarios ===== */
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
      // Alta
      const newId = (this.users.length ? Math.max(...this.users.map(u => u.id)) : 0) + 1;
      this.users.push({ id: newId, name, email, role });
    } else {
      // Edición
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
