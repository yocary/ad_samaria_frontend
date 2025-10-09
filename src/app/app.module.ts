import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './routers/app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './components/app-component/app.component';
import { MaterialModule } from './modules/material.module';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ScrollSpyDirective } from './directives/scroll-spy/scroll-spy.directive';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InicioComponent } from './components/inicio/inicio.component';
import { JwtInterceptor } from './interceptors/JwtInterceptor.intercerptor';
import { SpinnerService } from './services/spinner.service';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { SpinnerInterceptor } from './interceptors/spinner.interceptor';
import { DatePipe } from '@angular/common';
import { MiembrosFormComponent } from './components/miembros-form/miembros-form.component';
import { RolesComponent } from './components/roles/roles.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RouterModule } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { FamiliasComponent } from './components/familias/familias.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { DialogAddFamilyComponent } from './components/dialog-add-family/dialog-add-family.component';
import { DialogEditFamilyComponent } from './components/dialog-edit-family/dialog-edit-family.component';
import { FinanzasComponent } from './components/finanzas/finanzas.component';
import { DialogAddTreasuryComponent } from './components/finanzas/dialogs/dialog-add-treasury/dialog-add-treasury.component';
import { DialogMovementComponent } from './components/finanzas/dialogs/dialog-movement/dialog-movement.component';
import { DialogTreasuryDetailComponent } from './components/finanzas/dialogs/dialog-treasury-detail/dialog-treasury-detail.component';
import { LiderazgoComponent } from './components/liderazgo/liderazgo.component';
import { DialogMinistryMembersComponent } from './components/liderazgo/dialog-ministry-members/dialog-ministry-members.component';
import { DialogEditMinistryComponent } from './components/liderazgo/dialog-edit-ministry/dialog-edit-ministry.component';
import { CertificadosComponent } from './components/certificados/certificados.component';
import { DialogCertificadoComponent } from './components/certificados/dialog-certificado/dialog-certificado/dialog-certificado.component';


const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD-MM-YYYY',
  },
  display: {
    dateInput: 'DD-MM-YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@NgModule({
  declarations: [
     AppComponent,
    SpinnerComponent,
    ScrollSpyDirective,
    MiembrosFormComponent,
    RolesComponent,
    DashboardComponent,
    FamiliasComponent,
    DialogAddFamilyComponent,
    DialogEditFamilyComponent,
    FinanzasComponent,
    DialogAddTreasuryComponent,
    DialogMovementComponent,
    DialogTreasuryDetailComponent,
    LiderazgoComponent,
    DialogMinistryMembersComponent,
    DialogEditMinistryComponent,
    CertificadosComponent,
    DialogCertificadoComponent,
  ],
  imports: [
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MaterialModule,
    HttpClientModule,
    NgxSpinnerModule,
    NgbModule,
    RouterModule,
    MatRippleModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatIconModule 
  ],
  providers: [
    DatePipe,
    SpinnerService,
    { provide: HTTP_INTERCEPTORS, useClass: SpinnerInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
