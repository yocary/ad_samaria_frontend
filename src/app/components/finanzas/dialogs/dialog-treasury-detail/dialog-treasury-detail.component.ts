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

import { FinanzasService } from 'src/app/services/finanzas.service';
import { Movement, Treasury } from 'src/app/models/finanzas.model';
import { DialogMovementComponent } from '../dialog-movement/dialog-movement.component';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

type TabKey = 'mov' | 'cat' | 'users' | 'edit';

type UICategory = {
  id: number;
  name: string;
  type: 'Ingreso' | 'Egreso';
  finanzasGenerales: boolean;
  editing?: boolean;
  _name?: string;
  _type?: 'Ingreso' | 'Egreso';
  _finanzasGenerales?: boolean;
};

@Component({
  selector: 'app-dialog-treasury-detail',
  templateUrl: './dialog-treasury-detail.component.html',
  styleUrls: ['./dialog-treasury-detail.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DialogTreasuryDetailComponent implements OnInit, OnDestroy {
  tiposMov: { id: number; nombre: string }[] = [];
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
  catList: UICategory[] = [];
  private catIdSeq = 3;

  /* ---------- USUARIOS (mock por ahora) ---------- */
  userRoles = ['Administrador', 'Tesorero', 'Revisor', 'Lector'];
  users: { id: number; name: string; email: string; role: string }[] = [
    {
      id: 1,
      name: 'Nombre usuario',
      email: 'usuario@e.com.gt',
      role: 'Administrador',
    },
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

    // Inicializa título con el nombre recibido
    if (this.data.treasuryName) {
      this.treasury = {
        id: this.treasuryId,
        name: this.data.treasuryName,
      } as any;
    }

    // Sincroniza tesorería desde el servicio
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

    // Cargar opciones del select de tipo de movimiento
    this.cargarTiposMovimiento();

    // Cargar categorías (Ingreso/Egreso)
    this.recargarTablaCategorias();

    // Buscar → reconsultar backend con q (debounced)
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

  private cargarTiposMovimiento() {
    this.fin.getTiposMovimiento().subscribe((list) => (this.tiposMov = list || []));
  }

private recargarTablaCategorias() {
  Promise.all([
    this.fin.getCategoriasPorTipo('Ingreso').toPromise(),
    this.fin.getCategoriasPorTipo('Egreso').toPromise()
  ]).then(([ing = [], egr = []]) => {
    const mapCat = (c: any, type: 'Ingreso' | 'Egreso') => ({
      id: c.id,
      name: c.nombre,
      type,
      // acepta cualquiera de los dos nombres que pueda mandar el backend
      finanzasGenerales: Boolean(
        c.finanzasGenerales ?? c.finanzas_generales ?? c.finanzas_generale // por si acaso
      ),
    });

    this.catList = [
      ...ing.map((c: any) => mapCat(c, 'Ingreso')),
      ...egr.map((c: any) => mapCat(c, 'Egreso')),
    ];
  });
}


  /** Llama al backend para recargar movimientos usando periodo + q actuales */
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

  /** Llama al backend para traer totales de la tesorería y refrescar KPIs */
  private cargarResumen(periodo: 'mes' | 'mes_anterior' | 'anio' | 'todos'): void {
    this.fin.getResumenTesoreria(this.treasuryId, periodo).subscribe((r) => {
      this.kpiIngresos = r?.totalIngresos ?? 0;
      this.kpiEgresos = r?.totalEgresos ?? 0;
      this.kpiSaldo = this.kpiIngresos - this.kpiEgresos;
    });
  }

  private updateKPIs() {
    const list = this.movements;
    this.kpiIngresos = list
      .filter((m) => m.type === 'Ingreso')
      .reduce((a, b) => a + (b.amount || 0), 0);
    this.kpiEgresos = list
      .filter((m) => m.type === 'Egreso')
      .reduce((a, b) => a + (b.amount || 0), 0);
    this.kpiSaldo = this.kpiIngresos - this.kpiEgresos;
  }

  /** Mapea el select de UI a periodo del backend y recarga */
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
      data: { treasuryId: this.treasuryId },
    })
    .afterClosed()
    .subscribe((result: any) => {
      if (result?.success) {
        this.reloadMovimientos();
        this.cargarResumen(this.currentPeriod);
        
        // Si se indica recargar finanzas, emitir evento
        if (result.reloadFinanzas) {
          this.dialogRef.close({ reloadFinanzas: true }); // ← Cierra el diálogo con flag
        }
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
        
        // Si se indica recargar finanzas, emitir evento
        if (result.reloadFinanzas) {
          this.dialogRef.close({ reloadFinanzas: true }); // ← Cierra el diálogo con flag
        }
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

  /* ===== Categorías ===== */
addCategory(): void {
  const nombre = (this.catName.value || '').trim();
  const tipoId = this.catTypeId.value;
  const finanzasGenerales = !!this.catGeneral.value;
  if (!nombre || !tipoId) return;

  const payload = {
    nombre,
    tipoMovimientoId: tipoId,
    finanzasGenerales,
    finanzas_generales: finanzasGenerales
  };

  console.log('[ADD] payload ->', payload);

  this.fin.createCategoria(payload).subscribe({
    next: (res: any) => {
      console.log('[ADD] response ->', res);
      this.catList = [
        ...this.catList,
        {
          id: res.id,
          name: res.nombre,
          type: res.tipo as ('Ingreso'|'Egreso'),
          finanzasGenerales: Boolean(res.finanzasGenerales ?? res.finanzas_generales)
        }
      ];
      this.catName.reset();
      this.catTypeId.reset();
      this.catGeneral.setValue(false);
    },
    error: (err) => console.error('Error creando categoría', err),
  });
}

saveEditCategory(c: any): void {
  const nombre = (c._name || '').trim();
  const tipoNombre = (c._type || '').trim(); // "Ingreso" | "Egreso"
  const finanzasGenerales = !!c._finanzasGenerales;
  if (!nombre || (tipoNombre !== 'Ingreso' && tipoNombre !== 'Egreso')) return;

  const tipo = this.tiposMov.find(t => t.nombre.toLowerCase() === tipoNombre.toLowerCase());
  if (!tipo) return;

  const payload = {
    nombre,
    tipoMovimientoId: tipo.id,
    finanzasGenerales,
    finanzas_generales: finanzasGenerales
  };

  console.log('[UPDATE] payload ->', payload);

  this.fin.updateCategoria(c.id, payload).subscribe({
    next: (res: any) => {
      console.log('[UPDATE] response ->', res);
      c.name = res.nombre;
      c.type = res.tipo as ('Ingreso'|'Egreso');
      c.finanzasGenerales = Boolean(res.finanzasGenerales ?? res.finanzas_generales);
      c.editing = false;
      delete c._name; delete c._type; delete c._finanzasGenerales;
    },
    error: (err) => console.error('Error al actualizar categoría', err)
  });
}


  startEditCategory(c: UICategory): void {
    c.editing = true;
    c._name = c.name;
    c._type = c.type;
    c._finanzasGenerales = c.finanzasGenerales;
  }

// saveEditCategory(c: any): void {
//   const nombre = (c._name || '').trim();
//   const tipoNombre = (c._type || '').trim(); // "Ingreso" | "Egreso"
//   const finanzasGenerales = !!c._finanzasGenerales;
//   if (!nombre || (tipoNombre !== 'Ingreso' && tipoNombre !== 'Egreso')) return;

//   const tipo = this.tiposMov.find(
//     t => t.nombre.toLowerCase() === tipoNombre.toLowerCase()
//   );
//   if (!tipo) return;

//   const payload = {
//     nombre,
//     tipoMovimientoId: tipo.id,
//     finanzasGenerales,
//     finanzas_generales: finanzasGenerales,
//   };

//   this.fin.updateCategoria(c.id, payload).subscribe({
//     next: (res: any) => {
//       c.name = res.nombre;
//       c.type = res.tipo as ('Ingreso'|'Egreso');
//       c.finanzasGenerales = Boolean(
//         res.finanzasGenerales ?? res.finanzas_generales
//       );
//       c.editing = false;
//       delete c._name; delete c._type; delete c._finanzasGenerales;
//     },
//     error: (err) => console.error('Error al actualizar categoría', err)
//   });
// }


  cancelEditCategory(c: UICategory): void {
    c.editing = false;
    delete c._name;
    delete c._type;
    delete c._finanzasGenerales;
  }

  removeCategory(c: UICategory): void {
    if (!c?.id) return;
    this.fin.deleteCategoria(c.id).subscribe({
      next: () => {
        this.catList = this.catList.filter((x) => x.id !== c.id);
      },
      error: (err) => console.error('Error al eliminar categoría', err),
    });
  }

  /* ===== Usuarios (mock) ===== */
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

  /* ===== Edit Tesorería ===== */
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
            }).then(() => {
              this.dialogRef.close({ deleted: true });
            });
          },
          error: (err) => {
            const msg =
              err?.error?.message || 'No se pudo eliminar la tesorería.';
            console.error('Error al eliminar tesorería', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: msg,
              confirmButtonColor: '#3085d6',
            });
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
    ws['!cols'] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 40 },
      { wch: 12 },
      { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
    const safeName = (this.treasury?.name || 'tesoreria').replace(/[^\w\-]+/g, '_');
    const hoy = new Date().toISOString().slice(0, 10);
    const file = `movimientos_${safeName}_${this.currentPeriod}_${hoy}.xlsx`;
    XLSX.writeFile(wb, file, { cellDates: true });
  }
}
