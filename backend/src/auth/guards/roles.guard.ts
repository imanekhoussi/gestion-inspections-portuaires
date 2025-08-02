// src/auth/guards/roles.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleUtilisateur } from '../../entities/utilisateur.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleUtilisateur[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true; // Pas de restriction de rôle
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false; // Utilisateur non authentifié
    }
    
    return requiredRoles.some((role) => user.role === role);
  }
}
