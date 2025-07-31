// src/app/features/layout/components/main-layout/main-layout.component.ts
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
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
    CommonModule,
    AsyncPipe,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatDividerModule,
    MatExpansionModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') drawer!: MatSidenav;
  
  private destroy$ = new Subject<void>();
  currentUser$: Observable<User | null>;
  
  // Initialiser isHandset$ dans le constructeur pour éviter l'erreur
  isHandset$!: Observable<boolean>;

  navigationItems: NavigationItem[] = [
    {
      label: 'Tableau de Bord',
      route: '/dashboard',
      icon: 'dashboard'
    },
    {
      label: 'Actifs',
      route: '/actifs',
      icon: 'location_on',
      children: [
        { label: 'Cartographie', route: '/actifs/map', icon: 'map' },
        { label: 'Liste', route: '/actifs/list', icon: 'list' }
      ]
    },
    {
      label: 'Inspections',
      route: '/inspections',
      icon: 'assignment'
    },
    {
      label: 'Planning',
      route: '/planning',
      icon: 'event'
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
    // Vérifier l'authentification au démarrage
    this.authService.isAuthenticated$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isAuth => {
      if (!isAuth) {
        this.router.navigate(['/login']);
      }
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

  // Méthode pour gérer la fermeture du drawer sur mobile
  closeDrawerIfMobile(): void {
    this.isHandset$.pipe(takeUntil(this.destroy$)).subscribe(isHandset => {
      if (isHandset && this.drawer) {
        this.drawer.close();
      }
    });
  }
}