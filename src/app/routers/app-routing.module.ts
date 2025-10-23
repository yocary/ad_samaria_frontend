import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { AuthGuard } from "../auth/auth.guard";
import { InicioComponent } from "../components/inicio/inicio.component";
import { MiembrosFormComponent } from "../components/miembros-form/miembros-form.component";
import { RolesComponent } from "../components/roles/roles.component";
import { DashboardComponent } from "../components/dashboard/dashboard.component";
import { FamiliasComponent } from "../components/familias/familias.component";
import { FinanzasComponent } from "../components/finanzas/finanzas.component";
import { LiderazgoComponent } from "../components/liderazgo/liderazgo.component";
import { CertificadosComponent } from "../components/certificados/certificados.component";
import { MiembrosHomeComponent } from "../components/miembros-home/miembros-home.component";
import { RolesHomeComponent } from "../components/roles/roles-home/roles-home.component";
import { RolesRemoveComponent } from "../components/roles/roles-remove/roles-remove.component";
import { PlanificacionHomeComponent } from "../components/planificacion/planificacion-home/planificacion-home.component";
import { PlanificacionGrupoDetalleComponent } from "../components/planificacion/planificacion-grupo-detalle/planificacion-grupo-detalle.component";
import { PlanificacionEventosComponent } from "../components/planificacion/planificacion-eventos/planificacion-eventos.component";



const routes: Routes = [
  { path: 'inicio', component: InicioComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'miembros', component: MiembrosFormComponent },
  { path: 'roles', component: RolesComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'agregar-familia', component: FamiliasComponent },
  { path: 'finanzas', component: FinanzasComponent },
  { path: 'liderazgo', component: LiderazgoComponent },
  { path: 'certificados', component: CertificadosComponent },
    { path: 'planificacion', component: PlanificacionHomeComponent },
   { path: 'miembros', children: [
      { path: 'home', component: MiembrosHomeComponent },
      { path: 'nuevo', component: MiembrosFormComponent },
    ]
  },
  { path: 'roles', children: [
      { path: 'home', component: RolesHomeComponent },
      { path: 'agregar', component: RolesComponent },
            { path: 'eliminar', component: RolesRemoveComponent },
    ]
  },
    { path: 'familias', component: FamiliasComponent },
      { path: 'planificacion/grupo/:id', component: PlanificacionGrupoDetalleComponent },
            { path: 'planificacion/grupo/:id/eventos', component: PlanificacionEventosComponent },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
