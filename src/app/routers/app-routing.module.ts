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
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
