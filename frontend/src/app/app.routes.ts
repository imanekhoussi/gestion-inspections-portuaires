import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/components/login/login.component').then(m => m.LoginComponent)
  },
  {
  path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes)
  },
  {
    path: '',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/layout/components/main-layout/main.layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'actifs',
        children: [
          {
            path: '',
            redirectTo: 'map',
            pathMatch: 'full'
          },
          {
            path: 'map',
            loadComponent: () => import('./features/actifs/components/actifs-map/actifs-map.component').then(m => m.ActifsMapComponent)
          },
          {
            path: 'list',
            loadComponent: () => import('./features/actifs/components/actifs-list/actifs-list.component').then(m => m.ActifsListComponent)
          }
        ]
      },
{
        path: 'familles',
        children: [
          {
            path: '',
            redirectTo: 'list',
            pathMatch: 'full'
          },
          {
            path: 'list',
            loadComponent: () => import('./features/famille/components/familles-list/familles-list.components').then(m => m.FamillesListComponent)
          },
          {
            path: ':familleId/groupes',
            loadComponent: () => import('./features/famille/components/groupes-list/groupes-list.component').then(m => m.GroupesListComponent)
          },
          {
            path: 'groupes/:groupeId/actifs',
            loadComponent: () => import('./features/famille/components/actifs-by-groupe/actifs-by-groupe.component').then(m => m.ActifsByGroupeComponent)
          }
        ]
      },

      {
        path: 'inspections',
        loadComponent: () => import('./features/inspections/components/inspections-list/inspections-list.component').then(m => m.InspectionsListComponent)
      }
    ]
  }
]