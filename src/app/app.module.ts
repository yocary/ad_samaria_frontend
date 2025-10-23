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
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatRippleModule } from '@angular/material/core';
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
import { DialogIntegrantesComponent } from './components/liderazgo/dialog-integrantes/dialog-integrantes.component';
import { DialogRolComponent } from './components/liderazgo/dialog-rol/dialog-rol.component';
import { MiembrosHomeComponent } from './components/miembros-home/miembros-home.component';
import { MemberCardDialogComponent } from './components/member-card-dialog/member-card-dialog.component';
import { RolesHomeComponent } from './components/roles/roles-home/roles-home.component';
import { RolesRemoveComponent } from './components/roles/roles-remove/roles-remove.component';
import { PlanificacionHomeComponent } from './components/planificacion/planificacion-home/planificacion-home.component';
import { CreateGrupoDialogComponent } from './components/planificacion/create-grupo-dialog/create-grupo-dialog.component';
import { PlanificacionGrupoDetalleComponent } from './components/planificacion/planificacion-grupo-detalle/planificacion-grupo-detalle.component';
import { PlanificacionGrupoIntegrantesComponent } from './components/planificacion/planificacion-grupo-integrantes/planificacion-grupo-integrantes.component';
import { PlanificacionEventosComponent } from './components/planificacion/planificacion-eventos/planificacion-eventos.component';
import { EventoNewDialogComponent } from './components/planificacion/evento-new-dialog/evento-new-dialog.component';


export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
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
    DialogIntegrantesComponent,
    DialogRolComponent,
    MiembrosHomeComponent,
    MemberCardDialogComponent,
    RolesHomeComponent,
    RolesRemoveComponent,
    PlanificacionHomeComponent,
    CreateGrupoDialogComponent,
    PlanificacionGrupoDetalleComponent,
    PlanificacionGrupoIntegrantesComponent,
    PlanificacionEventosComponent,
    EventoNewDialogComponent,
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
    { provide: HTTP_INTERCEPTORS, useClass: SpinnerInterceptor, multi: true },
        { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }, // idioma español
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
