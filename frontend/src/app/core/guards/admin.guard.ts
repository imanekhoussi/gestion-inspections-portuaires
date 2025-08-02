import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.services';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const currentUser = authService.getCurrentUser();
  
  if (currentUser && currentUser.role === 'admin') {
    return true;
  } else {
    router.navigate(['/dashboard']);
    return false;
  }
};