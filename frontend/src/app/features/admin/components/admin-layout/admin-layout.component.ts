import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subject } from 'rxjs';
import { map, shareReplay, takeUntil } from 'rxjs/operators';

// Material imports
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../../../core/services/auth.services';
import { User } from '../../../../core/models/user.interface';

interface AdminMenuItem {
  label: string;
  route: string;
  icon: string;
  description: string;
  badge?: number;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') drawer!: MatSidenav;
  
  private destroy$ = new Subject<void>();
  currentUser$: Observable<User | null>;
  
  isHandset$: Observable<boolean>;

  adminMenuItems: AdminMenuItem[] = [
    {
      label: 'Vue d\'ensemble',
      route: '/admin/dashboard',
      icon: 'dashboard',
      description: 'Statistiques et aperçu général'
    },
    {
      label: 'Utilisateurs',
      route: '/admin/utilisateurs',
      icon: 'people',
      description: 'Gestion des comptes utilisateurs'
    },
    {
      label: 'Familles',
      route: '/admin/familles',
      icon: 'folder',
      description: 'Gestion des familles d\'équipements'
    },
    {
      label: 'Groupes',
      route: '/admin/groupes',
      icon: 'group_work',
      description: 'Gestion des groupes par famille'
    },
    {
      label: 'Types d\'Inspection',
      route: '/admin/types-inspection',
      icon: 'rule',
      description: 'Configuration des types d\'inspections'
    },
    {
      label: 'Inspections',
      route: '/admin/inspections',
      icon: 'assignment',
      description: 'Création et suivi des inspections'
    },
    {
      label: 'Arborescence',
      route: '/admin/arborescence',
      icon: 'account_tree',
      description: 'Vue hiérarchique de la structure'
    }
  ];

  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
    
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(
        map(result => result.matches),
        shareReplay()
      );
  }

  ngOnInit(): void {
    // Vérifier que l'utilisateur est admin
    this.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      if (!user || user.role !== 'admin') {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  backToApp(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
  }

  closeDrawerIfMobile(): void {
    this.isHandset$.pipe(takeUntil(this.destroy$)).subscribe(isHandset => {
      if (isHandset && this.drawer) {
        this.drawer.close();
      }
    });
  }

  isActiveRoute(route: string): boolean {
    return this.router.url.startsWith(route);
  }
  getCurrentSectionName(): string {
  const url = this.router.url;
  const sections: { [key: string]: string } = {
    '/admin/dashboard': 'Vue d\'ensemble',
    '/admin/utilisateurs': 'Utilisateurs',
    '/admin/familles': 'Familles', 
    '/admin/groupes': 'Groupes',
    '/admin/types-inspection': 'Types d\'Inspection',
    '/admin/inspections': 'Inspections',
    '/admin/arborescence': 'Arborescence'
  };
  
  for (const [path, name] of Object.entries(sections)) {
    if (url.startsWith(path)) {
      return name;
    }
  }
  
  return 'Administration';
}
}