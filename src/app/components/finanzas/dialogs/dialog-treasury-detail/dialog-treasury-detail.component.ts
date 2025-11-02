import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialog,
} from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { FinanzasService, TipoMovimientoMini } from 'src/app/services/finanzas.service';
import { Movement, Treasury } from 'src/app/models/finanzas.model';
import { DialogMovementComponent } from '../dialog-movement/dialog-movement.component';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

type TabKey = 'mov' | 'cat' | 'users' | 'edit';

type CategoriaUI = {
  id: number;
  name: string;
  typeId: number;                       // 1 | 2
  typeName: 'Ingreso' | 'Egreso';       // derivado de typeId
  finanzasGenerales: boolean;
  editing?: boolean;
  _name?: string;
  _typeId?: number;                     // edición: id del tipo
  _finanzasGenerales?: boolean;
};

@Component({
  selector: 'app-dialog-treasury-detail',
  templateUrl: './dialog-treasury-detail.component.html',
  styleUrls: ['./dialog-treasury-detail.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DialogTreasuryDetailComponent implements OnInit, OnDestroy {
  tiposMov: TipoMovimientoMini[] = [];          // [{id:1,nombre:'Ingreso'},{id:2,nombre:'Egreso'}]
catTypeId: FormControl = new FormControl(null);
catGeneral: FormControl = new FormControl(false);
  /* ---------- Tabs ---------- */
  selectedIndex = 0;
  tabs: { key: TabKey; label: string }[] = [
    { key: 'mov', label: 'Movimientos' },
    { key: 'cat', label: 'Categorías' },
    { key: 'users', label: 'Administrar Usuarios' },
    { key: 'edit', label: 'Editar Tesorería' },
  ];

  treasury?: Treasury | null;
  treasuryId!: number;

  /* ---------- MOVIMIENTOS ---------- */
  searchMov = new FormControl('');
  movements: Movement[] = [];
  kpiIngresos = 0;
  kpiEgresos = 0;
  kpiSaldo = 0;

  /** Periodo actual del backend ('mes' | 'mes_anterior' | 'anio' | 'todos') */
  private currentPeriod: 'mes' | 'mes_anterior' | 'anio' | 'todos' = 'mes';

  /* ---------- CATEGORÍAS ---------- */
  catName = new FormControl('');
  catList: CategoriaUI[] = [];

  /* ---------- USUARIOS (mock) ---------- */
  userRoles = ['Administrador', 'Tesorero', 'Revisor', 'Lector'];
  users: { id: number; name: string; email: string; role: string }[] = [
    { id: 1, name: 'Nombre usuario', email: 'usuario@e.com.gt', role: 'Administrador' },
  ];
  userName = new FormControl('');
  userEmail = new FormControl('');
  userRole = new FormControl('');
  userEditing = false;
  private editingId: number | null = null;

  /* ---------- EDIT TESORERÍA ---------- */
  treasuryStatuses = ['Activo', 'Inactivo'];
  currencies = [{ value: 'GTQ', label: '(GTQ) Guatemala' }];
  editForm = new FormGroup({
    name: new FormControl('', Validators.required),
    status: new FormControl('Activo'),
    currency: new FormControl('GTQ'),
  });

  /* ---------- Subs ---------- */
  private subs = new Subscription();

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { treasuryId: number; treasuryName?: string },
    private dialogRef: MatDialogRef<DialogTreasuryDetailComponent>,
    private fin: FinanzasService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.treasuryId = this.data.treasuryId;

    if (this.data.treasuryName) {
      this.treasury = { id: this.treasuryId, name: this.data.treasuryName } as any;
    }

    this.subs.add(
      this.fin.treasuries$.subscribe((list: Treasury[]) => {
        const found = list?.find((t) => t.id === this.treasuryId) || null;
        if (found) {
          this.treasury = found;
          this.editForm.patchValue(
            {
              name: found.name,
              status: found.status,
              currency: (found as any).currency || 'GTQ',
            },
            { emitEvent: false }
          );
        }
      })
    );

    // Cargar catálogo de tipos, setear default, y cargar categorías
    this.initCategoriasTab();

    // Buscar movimientos
    this.subs.add(
      this.searchMov.valueChanges.pipe(debounceTime(250)).subscribe(() => {
        this.reloadMovimientos();
      })
    );

    // Primera carga
    this.reloadMovimientos();
    this.cargarResumen(this.currentPeriod);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /* ==================== CATEGORÍAS ==================== */

  private initCategoriasTab() {
    this.fin.getTiposMovimiento().subscribe((tipos) => {
      this.tiposMov = tipos || [];
      const def =
        this.tiposMov.find((t) => t.nombre === 'Ingreso')?.id ??
        this.tiposMov[0]?.id ??
        1;
      this.catTypeId.setValue(def, { emitEvent: false });
      this.loadCategorias(); // primera carga
    });

    // recargar al cambiar el tipo
    this.subs.add(
      this.catTypeId.valueChanges.subscribe(() => this.loadCategorias())
    );
  }

  private loadCategorias() {
    const tesoreriaId = this.treasuryId;
    const tipoId = this.catTypeId.value!;
    if (!tesoreriaId || !tipoId) {
      this.catList = [];
      return;
    }
    this.fin.getCategoriasPorTesoreria(tesoreriaId, tipoId).subscribe((arr) => {
      this.catList = (arr || []).map((res) => {
        const tm = this.tiposMov.find((t) => t.id === res.tipoId);
        const typeName = (tm?.nombre === 'Ingreso' ? 'Ingreso' : 'Egreso') as
          | 'Ingreso'
          | 'Egreso';
        return {
          id: res.id,
          name: res.nombre,
          typeId: res.tipoId,
          typeName,
          finanzasGenerales: !!res.finanzasGenerales,
        } as CategoriaUI;
      });
    });
  }

  addCategory(): void {
    const nombre = (this.catName.value || '').trim();
    const tipoId = this.catTypeId.value!;
    const finanzasGenerales = !!this.catGeneral.value;
    if (!nombre || !tipoId) return;

    this.fin
      .createCategoriaLocal(this.treasuryId, { nombre, tipoId, finanzasGenerales })
      .subscribe({
        next: () => {
          this.loadCategorias();
          this.catName.setValue('');
          this.catGeneral.setValue(false);
        },
        error: (err) => console.error('Error creando categoría', err),
      });
  }

  startEditCategory(c: CategoriaUI): void {
    c.editing = true;
    c._name = c.name;
    c._typeId = c.typeId;
    c._finanzasGenerales = c.finanzasGenerales;
  }

  saveEditCategory(c: CategoriaUI): void {
    const nombre = (c._name || '').trim();
    const tipoId = c._typeId ?? c.typeId;
    const finanzasGenerales = !!c._finanzasGenerales;
    if (!nombre || !tipoId) return;

    this.fin
      .updateCategoriaLocal(c.id, {
        nombre,
        tipoId,
        finanzasGenerales,
        tesoreriaId: this.treasuryId,
      })
      .subscribe({
        next: () => {
          c.editing = false;
          this.loadCategorias(); // refrescar desde backend
        },
        error: (err) => console.error('Error al actualizar categoría', err),
      });
  }

  cancelEditCategory(c: CategoriaUI): void {
    c.editing = false;
    delete c._name;
    delete c._typeId;
    delete c._finanzasGenerales;
  }

  removeCategory(c: CategoriaUI): void {
    if (!c?.id) return;
    this.fin.deleteCategoria(c.id).subscribe({
      next: () => (this.catList = this.catList.filter((x) => x.id !== c.id)),
      error: (err) => console.error('Error al eliminar categoría', err),
    });
  }

  /* ==================== MOVIMIENTOS ==================== */

  private reloadMovimientos(): void {
    this.fin
      .loadMovimientos(this.treasuryId, {
        periodo: this.currentPeriod,
        q: (this.searchMov.value || '').toString().trim(),
      })
      .subscribe((list) => {
        this.movements = list || [];
        this.updateKPIs();
      });
  }

  private cargarResumen(periodo: 'mes' | 'mes_anterior' | 'anio' | 'todos'): void {
    this.fin.getResumenTesoreria(this.treasuryId, periodo).subscribe((r) => {
      this.kpiIngresos = r?.totalIngresos ?? 0;
      this.kpiEgresos = r?.totalEgresos ?? 0;
      this.kpiSaldo = this.kpiIngresos - this.kpiEgresos;
    });
  }

  private updateKPIs() {
    const list = this.movements || [];
    this.kpiIngresos = list
      .filter((m) => m.type === 'Ingreso')
      .reduce((a, b) => a + (b.amount || 0), 0);
    this.kpiEgresos = list
      .filter((m) => m.type === 'Egreso')
      .reduce((a, b) => a + (b.amount || 0), 0);
    this.kpiSaldo = this.kpiIngresos - this.kpiEgresos;
  }

  periodChanged(v: string) {
    const map: Record<string, 'mes' | 'mes_anterior' | 'anio' | 'todos'> = {
      all: 'todos',
      m1: 'mes',
      m3: 'mes_anterior',
      y1: 'anio',
    };
    this.currentPeriod = map[v] || 'mes';
    this.reloadMovimientos();
    this.cargarResumen(this.currentPeriod);
  }

  addMovement() {
    this.dialog
      .open(DialogMovementComponent, {
        width: '680px',
        disableClose: true,
  data: { treasuryId: this.treasuryId } as { treasuryId: number },
      })
      .afterClosed()
      .subscribe((result: any) => {
        if (result?.success) {
          this.reloadMovimientos();
          this.cargarResumen(this.currentPeriod);
          if (result.reloadFinanzas) this.dialogRef.close({ reloadFinanzas: true });
        }
      });
  }

  editMovement(row: Movement) {
    this.dialog
      .open(DialogMovementComponent, {
        width: '680px',
        disableClose: true,
        data: { treasuryId: this.treasuryId, movement: row },
      })
      .afterClosed()
      .subscribe((result: any) => {
        if (result?.success) {
          this.reloadMovimientos();
          this.cargarResumen(this.currentPeriod);
          if (result.reloadFinanzas) this.dialogRef.close({ reloadFinanzas: true });
        }
      });
  }

  deleteMovement(row: Movement) {
    if (!row?.id) return;
    this.fin.deleteMovement(this.treasuryId, row.id).subscribe({
      next: () => {
        this.reloadMovimientos();
        this.cargarResumen(this.currentPeriod);
      },
      error: (err) => console.error('Error al eliminar movimiento', err),
    });
  }

  /* ==================== USUARIOS MOCK ==================== */

  startAddUser() {
    this.editingId = null;
    this.userName.reset();
    this.userEmail.reset();
    this.userRole.reset();
    this.userEditing = true;
  }

  editUser(u: { id: number; name: string; email: string; role: string }) {
    this.editingId = u.id;
    this.userName.setValue(u.name);
    this.userEmail.setValue(u.email);
    this.userRole.setValue(u.role);
    this.userEditing = true;
  }

  saveUser() {
    const name = (this.userName.value || '').trim();
    const email = (this.userEmail.value || '').trim();
    const role = (this.userRole.value || '').trim();
    if (!name || !email || !role) return;

    if (this.editingId == null) {
      const newId =
        (this.users.length ? Math.max(...this.users.map((u) => u.id)) : 0) + 1;
      this.users.push({ id: newId, name, email, role });
    } else {
      const idx = this.users.findIndex((u) => u.id === this.editingId);
      if (idx >= 0) this.users[idx] = { id: this.editingId, name, email, role };
    }

    this.userEditing = false;
    this.editingId = null;
    this.userName.reset();
    this.userEmail.reset();
    this.userRole.reset();
  }

  cancelUser() {
    this.userEditing = false;
    this.editingId = null;
    this.userName.reset();
    this.userEmail.reset();
    this.userRole.reset();
  }

  removeUser(id: number) {
    this.users = this.users.filter((u) => u.id !== id);
  }

  /* ==================== EDIT TESORERÍA ==================== */

  saveTreasury() {
    if (!this.editForm.valid || !this.treasury) return;
    const nombre = (this.editForm.get('name')?.value as string)?.trim();
    const statusStr = this.editForm.get('status')?.value as 'Activo' | 'Inactivo';
    const estado = statusStr === 'Activo';
    this.fin.updateTesoreria(this.treasury.id!, { nombre, estado }).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => console.error('Error actualizando tesorería', err),
    });
  }

  deleteTreasury() {
    if (!this.treasury?.id) return;

    Swal.fire({
      title: '¿Eliminar esta tesorería?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        this.fin.deleteTesoreria(this.treasury!.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Eliminada',
              text: 'La tesorería se eliminó correctamente.',
              confirmButtonColor: '#3085d6',
            }).then(() => this.dialogRef.close({ deleted: true }));
          },
          error: (err) => {
            const msg = err?.error?.message || 'No se pudo eliminar la tesorería.';
            console.error('Error al eliminar tesorería', err);
            Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#3085d6' });
          },
        });
      }
    });
  }

  close() {
    this.dialogRef.close();
  }

  downloadMovimientosExcel(): void {
    const rows = (this.movements || []).map((r, idx) => ({
      'No.': idx + 1,
      Fecha: r.date ? new Date(r.date) : null,
      Concepto: r.category || r.concept || '',
      Tipo: r.type || '',
      Cantidad: Number(r.amount || 0),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 40 }, { wch: 12 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
    const safeName = (this.treasury?.name || 'tesoreria').replace(/[^\w\-]+/g, '_');
    const hoy = new Date().toISOString().slice(0, 10);
    const file = `movimientos_${safeName}_${this.currentPeriod}_${hoy}.xlsx`;
    XLSX.writeFile(wb, file, { cellDates: true });
  }
}
