// src/auth/guards/jwt-auth.guard.ts - REMPLACER VOTRE FICHIER EXISTANT

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Vous pouvez ajouter de la logique personnalisée ici
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Vous pouvez personnaliser la gestion des erreurs JWT ici
    if (err || !user) {
      throw err || new Error('Token invalide');
    }
    return user;
  }
}