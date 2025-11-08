import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../guards/auth.guard';

import { InicioComponent } from '../components/inicio/inicio.component';
import { MiembrosFormComponent } from '../components/miembros-form/miembros-form.component';
import { RolesComponent } from '../components/roles/roles.component';
import { DashboardComponent } from '../components/dashboard/dashboard.component';
import { FamiliasComponent } from '../components/familias/familias.component';
import { FinanzasComponent } from '../components/finanzas/finanzas.component';
import { LiderazgoComponent } from '../components/liderazgo/liderazgo.component';
import { CertificadosComponent } from '../components/certificados/certificados.component';
import { MiembrosHomeComponent } from '../components/miembros-home/miembros-home.component';
import { RolesHomeComponent } from '../components/roles/roles-home/roles-home.component';
import { RolesRemoveComponent } from '../components/roles/roles-remove/roles-remove.component';
import { PlanificacionHomeComponent } from '../components/planificacion/planificacion-home/planificacion-home.component';
import { PlanificacionGrupoDetalleComponent } from '../components/planificacion/planificacion-grupo-detalle/planificacion-grupo-detalle.component';
import { PlanificacionEventosComponent } from '../components/planificacion/planificacion-eventos/planificacion-eventos.component';
import { LoginComponent } from '../components/login/login.component';
import { CrearUsuarioDialogComponent } from '../components/crear-usuario-dialog/crear-usuario-dialog.component';

const routes: Routes = [
  // Ruta por defecto → login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Rutas públicas
  { path: 'login', component: LoginComponent },
  {
    path: 'crear-usuario',
    component: CrearUsuarioDialogComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ROLE_ADMINISTRADOR'] },
  },

  // Rutas protegidas por sesión
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'miembros',
    children: [
      {
        path: '',
        component: MiembrosFormComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ROLE_ADMINISTRADOR', 'ROLE_LÍDER'] },
      },
      {
        path: 'home',
        component: MiembrosHomeComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ROLE_ADMINISTRADOR', 'ROLE_LÍDER'] },
      },
      {
        path: 'nuevo',
        component: MiembrosFormComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ROLE_ADMINISTRADOR', 'ROLE_LÍDER'] },
      },
      {
        path: 'editar/:id',
        component: MiembrosFormComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ROLE_ADMINISTRADOR', 'ROLE_LÍDER'] },
      },
    ],
  },

  {
    path: 'roles',
    children: [
      {
        path: '',
        component: RolesComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ROLE_ADMINISTRADOR'] },
      },
      {
        path: 'home',
        component: RolesHomeComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ROLE_ADMINISTRADOR'] },
      },
      {
        path: 'agregar',
        component: RolesComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ROLE_ADMINISTRADOR'] },
      },
      {
        path: 'eliminar',
        component: RolesRemoveComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ROLE_ADMINISTRADOR'] },
      },
    ],
  },

  {
    path: 'planificacion',
    children: [
      {
        path: '',
        component: PlanificacionHomeComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ROLE_ADMINISTRADOR', 'ROLE_LÍDER'] },
      },
      {
        path: 'grupo/:id',
        component: PlanificacionGrupoDetalleComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ROLE_ADMINISTRADOR', 'ROLE_LÍDER'] },
      },
      {
        path: 'grupo/:id/eventos',
        component: PlanificacionEventosComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ROLE_ADMINISTRADOR', 'ROLE_LÍDER'] },
      },
    ],
  },

  {
    path: 'agregar-familia',
    component: FamiliasComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ROLE_ADMINISTRADOR'] },
  },
  {
    path: 'familias',
    component: FamiliasComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ROLE_ADMINISTRADOR'] },
  },
  {
    path: 'finanzas',
    component: FinanzasComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ROLE_ADMINISTRADOR'] },
  },
  {
    path: 'liderazgo',
    component: LiderazgoComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ROLE_ADMINISTRADOR', 'ROLE_LÍDER'] },
  },
  {
    path: 'certificados',
    component: CertificadosComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ROLE_ADMINISTRADOR'] },
  },

  // Ruta comodín → redirige a login
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
