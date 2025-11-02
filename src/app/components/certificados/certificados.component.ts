import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { Router } from '@angular/router';
import { DialogCertificadoComponent } from './dialog-certificado/dialog-certificado/dialog-certificado.component';
import {
  CertificadosApiService,
  CertificadoDTO,
} from 'src/app/services/certificados-api.service';

@Component({
  selector: 'app-certificados',
  templateUrl: './certificados.component.html',
  styleUrls: ['./certificados.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CertificadosComponent implements OnInit {
  search = new FormControl('');
  data: CertificadoDTO[] = [];
  filtered: CertificadoDTO[] = [];

  constructor(
    private api: CertificadosApiService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load();
    this.search.valueChanges
      .pipe(debounceTime(200))
      .subscribe((q) => this.applyFilter(q || ''));
  }

  private load(q: string = '') {
    this.api.listar(q).subscribe((list) => {
      this.data = list;
      this.applyFilter(this.search.value || '');
    });
  }

  private applyFilter(q: string) {
    const s = q.toLowerCase().trim();
    this.filtered = s
      ? this.data.filter(
          (c) =>
            (c.miembro || '').toLowerCase().includes(s) ||
            (c.tipo || '').toLowerCase().includes(s)
        )
      : this.data.slice();
  }

  openNew() {
    const ref = this.dialog.open(DialogCertificadoComponent, {
      width: '96vw',
      maxWidth: '860px',
      disableClose: true,
      autoFocus: false,
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) this.load();
    });
  }

  // ===== Descargar PDF =====
download(row: CertificadoDTO) {
  this.api.descargarPdf(row.id).subscribe({
    next: (blob) => {
      const fecha = row.fecha ? ` (${row.fecha})` : '';
      const nombreBase = `${row.tipo || 'certificado'} - ${
        row.miembro || ''
      }${fecha}`.trim();
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
      // Reemplazar alert por Swal.fire
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
        this.filtered = this.filtered.filter((x) => x.id !== row.id);
      },
    });
  }

  private descargarBlob(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/[\\/:*?"<>|]/g, '_');
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  back() {
    this.router.navigate(['/dashboard']);
  }
}
