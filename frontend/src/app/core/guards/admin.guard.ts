import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.services';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const currentUser = authService.getCurrentUser();
  
  // Vérifier si l'utilisateur est connecté
  if (!authService.isAuthenticated()) {
    console.log('Utilisateur non authentifié, redirection vers login');
    router.navigate(['/login']);
    return false;
  }
  
  // Vérifier si l'utilisateur est admin
  if (currentUser && currentUser.role === 'admin') {
    console.log('Accès admin autorisé pour:', currentUser.email);
    return true;
  } else {
    console.log('Accès admin refusé, utilisateur non admin:', currentUser?.role);
    router.navigate(['/dashboard']);
    return false;
  }
};