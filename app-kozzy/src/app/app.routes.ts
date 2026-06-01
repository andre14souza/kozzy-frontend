import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { CentralAtendimentoComponent } from './central-atendimento/central-atendimento.component';
import { RecuperarComponent } from './recuperar/recuperar.component';
import { SupervisorDashboardComponent } from './supervisor-dashboard/supervisor-dashboard.component';
import { SupervisorGuard, AtendenteGuard } from './auth.guard';
import { DesignSystemComponent } from './design-system/design-system.component';
import { ChamadosHojeComponent } from './chamados-hoje/chamados-hoje.component';
import { SettingsComponent } from './settings/settings.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'recuperar', component: RecuperarComponent },
  {
    path: 'supervisor',
    component: SupervisorDashboardComponent,
    canActivate: [SupervisorGuard]
  },
  {
    path: 'central',
    component: CentralAtendimentoComponent,
    canActivate: [AtendenteGuard]
  },
  {
    path: 'hoje',
    component: ChamadosHojeComponent,
    canActivate: [AtendenteGuard]
  },
  {
    path: 'configuracoes',
    component: SettingsComponent,
    canActivate: [AtendenteGuard]
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AtendenteGuard]
  },
  
  { path: '**', redirectTo: '/login' },
];
export class AppRoutingModule { }