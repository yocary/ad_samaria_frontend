import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SpinnerService } from '../../services/spinner.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpinnerComponent {
  loading$: Observable<boolean> = this.spinner.loading$;
  constructor(private spinner: SpinnerService) {}
}
