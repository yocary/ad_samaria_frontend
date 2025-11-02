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
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule, MatRippleModule } from '@angular/material/core';
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
import { AsistenciaDialogComponent } from './components/planificacion/asistencia-dialog/asistencia-dialog.component';
import { OfrendaDialogComponent } from './components/planificacion/ofrenda-dialog/ofrenda-dialog.component';
import { LoginComponent } from './components/login/login.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { CrearUsuarioDialogComponent } from './components/crear-usuario-dialog/crear-usuario-dialog.component';
import { CambiarPasswordDialogComponent } from './components/cambiar-password-dialog/cambiar-password-dialog.component';
import { DialogDiezmosComponent } from './components/finanzas/dialogs/dialog-diezmos/dialog-diezmos.component';
import { DialogAddDiezmoComponent } from './components/finanzas/dialogs/dialog-diezmos/dialog-add-diezmo/dialog-add-diezmo.component';
import { RequestInterceptor } from './interceptors/request.interceptor';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsInterceptor } from './core/interceptors/analytics.interceptor';
import { AnalyticsApiInterceptor } from './interceptors/analytics-api.interceptor';
import { MatOutlineFixDirective } from './shared/mat-outline-fix.directive';


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
    AsistenciaDialogComponent,
    OfrendaDialogComponent,
    LoginComponent,
    CrearUsuarioDialogComponent,
    CambiarPasswordDialogComponent,
    DialogDiezmosComponent,
    DialogAddDiezmoComponent,
    MatOutlineFixDirective
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
    MatIconModule,
      MatDatepickerModule,
    MatNativeDateModule,
  ],
  
  providers: [
    DatePipe,
    SpinnerService,
    AnalyticsService,
{ provide: HTTP_INTERCEPTORS, useClass: SpinnerInterceptor, multi: true },

  // 🟢 Adjunta Authorization: Bearer <token>
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },

  // 🔴 Maneja 401/403 con Swal y redirige al login
  { provide: HTTP_INTERCEPTORS, useClass: RequestInterceptor, multi: true },

  { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
  { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
  {
      provide: HTTP_INTERCEPTORS,
      useClass: AnalyticsInterceptor,
      multi: true,
    },
     {
    provide: HTTP_INTERCEPTORS,
    useClass: AnalyticsApiInterceptor,
    multi: true
  }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
