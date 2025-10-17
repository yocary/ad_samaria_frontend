import { CertificadosService, Certificate } from './../../services/certificado.service';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime } from 'rxjs/operators';
import { DialogCertificadoComponent } from './dialog-certificado/dialog-certificado/dialog-certificado.component'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-certificados',
  templateUrl: './certificados.component.html',
  styleUrls: ['./certificados.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CertificadosComponent implements OnInit {
  search = new FormControl('');
  data: Certificate[] = [];
  filtered: Certificate[] = [];

  constructor(private svc: CertificadosService, private dialog: MatDialog, private router: Router) {}

  ngOnInit(): void {
    this.svc.certs$.subscribe((list) => {
      this.data = list;
      this.applyFilter();
    });
    this.search.valueChanges
      .pipe(debounceTime(150))
      .subscribe(() => this.applyFilter());
  }

  private applyFilter() {
    const q = (this.search.value || '').toLowerCase().trim();
    this.filtered = q
      ? this.data.filter(
          (c) =>
            (c.memberName || '').toLowerCase().includes(q) ||
            (c.type || '').toLowerCase().includes(q)
        )
      : this.data.slice();
  }

  openNew() {
this.dialog.open(DialogCertificadoComponent, {
  width: '96vw',          // fluido en móviles
  maxWidth: '860px',      // tope en desktop (debe coincidir con el CSS)
  disableClose: true,
  autoFocus: false
});
  }

  download(_row: Certificate) {
    // TODO: generar PDF/archivo
    alert('Descargar (pendiente de implementar)');
  }

  remove(row: Certificate) {
    this.svc.remove(row.id);
    this.applyFilter();
  }

  back() {
    this.router.navigate(['/dashboard']);
  }
}
