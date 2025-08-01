// src/auth/strategies/jwt.strategy.ts - REMPLACER VOTRE FICHIER

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Utilisateur } from '../../entities/utilisateur.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Utilisateur)
    private utilisateurRepository: Repository<Utilisateur>,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    // Récupérer l'utilisateur complet depuis la base
    const user = await this.utilisateurRepository.findOne({
      where: { id: payload.sub },
      select: ['id', 'nom', 'email', 'role'] // Exclure le password
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      userId: user.id, // Alias pour compatibilité
      nom: user.nom,
      email: user.email,
      role: user.role
    };
  }
}
