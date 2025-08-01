// src/auth/auth.service.ts - REMPLACER LE BCRYPTJS PAR BCRYPT

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'; 
import { Utilisateur } from '../entities/utilisateur.entity';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Utilisateur)
    private utilisateurRepository: Repository<Utilisateur>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    
    const user = await this.utilisateurRepository.findOne({
      where: { email }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role
      }
    };
  }

  async register(registerDto: RegisterDto) {
    const { nom, email, password, role } = registerDto;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.utilisateurRepository.findOne({
      where: { email }
    });

    if (existingUser) {
      throw new UnauthorizedException('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = this.utilisateurRepository.create({
      nom,
      email,
      password: hashedPassword,
      role: role as any,
    });

    await this.utilisateurRepository.save(user);

    // Retourner sans le mot de passe
    const { password: _, ...result } = user;
    return result;
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.utilisateurRepository.findOne({
      where: { email }
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }
}