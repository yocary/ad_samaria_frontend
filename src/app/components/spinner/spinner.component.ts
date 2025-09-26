// spinner.component.ts
import { Component, OnInit } from '@angular/core';
import { SpinnerService } from '../../services/spinner.service';  // Asegúrate de que la ruta es correcta

@Component({
  selector: 'app-spinner',
  template: `
    <div *ngIf="isLoading" class="spinner-overlay">
      <div class="spinner"></div>
    </div>
  `,
  styleUrls: ['./spinner.component.scss'],
})
export class SpinnerComponent implements OnInit {
  isLoading = false;

  constructor(private spinnerService: SpinnerService) {}

  ngOnInit() {
    this.spinnerService.spinnerState.subscribe((state: boolean) => {
      this.isLoading = state;
    });
  }
}
