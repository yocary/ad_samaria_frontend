import { Component, OnInit, ViewEncapsulation, ViewChild, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { DialogCertificadoComponent } from './dialog-certificado/dialog-certificado/dialog-certificado.component';
import { CertificadosApiService, CertificadoDTO } from 'src/app/services/certificados-api.service';

import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-certificados',
  templateUrl: './certificados.component.html',
  styleUrls: ['./certificados.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CertificadosComponent implements OnInit, AfterViewInit {
  search = new FormControl('');
  data: CertificadoDTO[] = [];

  displayedColumns: string[] = ['member','type','date','actions'];
  dataSource = new MatTableDataSource<CertificadoDTO>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private api: CertificadosApiService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load();
    this.search.valueChanges
      .pipe(debounceTime(200))
      .subscribe(q => this.applyFilter(q || ''));
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    // fija 5 por página desde el inicio
    if (this.paginator) this.paginator._changePageSize(10);
  }

  private load(q: string = '') {
    this.api.listar(q).subscribe((list) => {
      this.data = list || [];
      // inicializa tabla
      this.applyFilter(this.search.value || '');
    });
  }

  private applyFilter(q: string) {
    const s = (q || '').toLowerCase().trim();
    const filtered = s
      ? this.data.filter(c =>
          (c.miembro || '').toLowerCase().includes(s) ||
          (c.tipo || '').toLowerCase().includes(s)
        )
      : this.data.slice();

    this.dataSource.data = filtered;
    // reset a primera página tras filtrar
    if (this.paginator) this.paginator.firstPage();
  }

  openNew() {
    const ref = this.dialog.open(DialogCertificadoComponent, {
      width: '96vw',
      maxWidth: '860px',
      disableClose: true,
      autoFocus: false,
    });
    ref.afterClosed().subscribe(ok => { if (ok) this.load(); });
  }

  // ===== Descargar PDF =====
  download(row: CertificadoDTO) {
    this.api.descargarPdf(row.id).subscribe({
      next: (blob) => {
        const fecha = row.fecha ? ` (${row.fecha})` : '';
        const nombreBase = `${row.tipo || 'certificado'} - ${row.miembro || ''}${fecha}`.trim();
        const filename = `${nombreBase}.pdf`.replace(/[\\/:*?"<>|]/g, '_');

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo descargar el PDF',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#d33'
        });
      },
    });
  }

  remove(row: CertificadoDTO) {
    this.api.delete(row.id).subscribe({
      next: () => {
        // elimina del datasource actual (mantiene página/paginación)
        const nextData = this.dataSource.data.filter(x => x.id !== row.id);
        this.data = this.data.filter(x => x.id !== row.id);
        this.dataSource.data = nextData;

        // si al borrar quedó página vacía y no es la primera, retrocede
        if (this.paginator && this.paginator.hasPreviousPage() && this.dataSource.data.length <= this.paginator.pageIndex * this.paginator.pageSize) {
          this.paginator.previousPage();
        }
      },
    });
  }

  back() { this.router.navigate(['/dashboard']); }
}
