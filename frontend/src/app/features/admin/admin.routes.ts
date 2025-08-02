import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./components/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'utilisateurs',
        loadComponent: () => import('./components/utilisateurs/utilisateurs.component').then(m => m.UtilisateursComponent)
      },
      {
        path: 'familles',
        loadComponent: () => import('./components/familles/familles.component').then(m => m.FamillesComponent)
      },
      {
        path: 'groupes',
        loadComponent: () => import('./components/groupes/groupes.component').then(m => m.GroupesComponent)
      },
      {
        path: 'types-inspection',
        loadComponent: () => import('./components/types-inspection/types-inspection.component').then(m => m.TypesInspectionComponent)
      },
      {
        path: 'inspections',
        loadComponent: () => import('./components/inspections/inspections.component').then(m => m.InspectionsComponent)
      },
      {
        path: 'arborescence',
        loadComponent: () => import('./components/arborescence/arborescence.component').then(m => m.ArborescenceComponent)
      }
    ]
  }
];