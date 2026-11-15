import { Routes } from '@angular/router';
import { authGuard, invitadoGuard } from './services/auth.guard';

export const routes: Routes = [
  {
    // Página de inicio de sesión / registro
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
    canActivate: [invitadoGuard],
  },
  {
    // Pestañas de la app: solo accesibles con sesión iniciada
    path: '',
    canActivate: [authGuard],
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
];
