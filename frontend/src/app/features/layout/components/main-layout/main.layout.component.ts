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

  // ✅ STEP 1: Add this new property to hold our dynamic list.
  navigationItems$!: Observable<NavigationItem[]>;

  // This is your original, correct list of navigation items.
  private baseNavigationItems: NavigationItem[] = [
    { label: 'Tableau de Bord', icon: 'dashboard', route: '/dashboard' },
    {
      label: 'Actifs', icon: 'location_on', route: '/actifs',
      children: [
        { label: 'Cartographie', icon: 'map', route: '/actifs/map' },
        { label: 'Liste', icon: 'list', route: '/actifs/list' }
      ]
    },
    {
      label: 'Familles', icon: 'folder', route: '/familles',
      children: [{ label: 'Liste des Familles', icon: 'folder_open', route: '/familles/list' }]
    },
    { label: 'Inspections', icon: 'assignment', route: '/inspections' },
    { label: 'Planning', icon: 'event', route: '/planning' }
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
    // ✅ STEP 2: Add this logic inside ngOnInit.
    // This creates the dynamic menu correctly.
    this.navigationItems$ = this.currentUser$.pipe(
      map(user => {
        if (user && user.role === 'admin') {
          const adminItem: NavigationItem = {
            label: 'Administration',
            route: '/admin',
            icon: 'admin_panel_settings'
          };
          // If the user is an admin, return the base list with the admin item.
          return [...this.baseNavigationItems, adminItem];
        }
        // Otherwise, return just the base list.
        return this.baseNavigationItems;
      })
    );

    // This part stays the same.
    this.authService.isAuthenticated$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isAuth => {
      if (!isAuth) this.router.navigate(['/login']);
    });
  }

  // ✅ STEP 3: The broken get navigationItemsWithAdmin() function has been completely removed.

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