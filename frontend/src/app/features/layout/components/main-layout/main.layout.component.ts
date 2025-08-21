import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subject } from 'rxjs';
import { map, shareReplay, takeUntil } from 'rxjs/operators';

import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';

import { AuthService } from '../../../../core/services/auth.services';
import { User } from '../../../../core/models/user.interface';

export interface NavigationItem {
  label: string;
  route: string;
  icon: string;
  children?: NavigationItem[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, AsyncPipe, RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatButtonModule, MatIconModule,
    MatListModule, MatMenuModule, MatDividerModule, MatExpansionModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') drawer!: MatSidenav;

  private destroy$ = new Subject<void>();
  currentUser$: Observable<User | null>;
  isHandset$: Observable<boolean>;

  navigationItems$!: Observable<NavigationItem[]>;

  private baseNavigationItems: NavigationItem[] = [
    { label: 'Tableau de Bord', icon: 'dashboard', route: '/dashboard' },
    {
      label: 'Actifs', icon: 'location_on', route: '/actifs/list',
      
    },
    {
      label: 'Familles', icon: 'folder', route: '/familles',
      children: [{ label: 'Liste des Familles', icon: 'folder_open', route: '/familles/list' }]
    },
    { label: 'Inspections', icon: 'assignment', route: '/inspections' },
  ];

  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(map(result => result.matches), shareReplay());
  }

  ngOnInit(): void {
    this.navigationItems$ = this.currentUser$.pipe(
      map(user => {
        if (user && user.role === 'admin') {
          const adminItem: NavigationItem = {
            label: 'Administration',
            route: '/admin',
            icon: 'admin_panel_settings'
          };
          return [...this.baseNavigationItems, adminItem];
        }
        return this.baseNavigationItems;
      })
    );

    this.authService.isAuthenticated$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isAuth => {
      if (!isAuth) this.router.navigate(['/login']);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.authService.logout();
  }

  isActiveRoute(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  closeDrawerIfMobile(): void {
    this.isHandset$.pipe(takeUntil(this.destroy$)).subscribe(isHandset => {
      if (isHandset && this.drawer) this.drawer.close();
    });
  }
}