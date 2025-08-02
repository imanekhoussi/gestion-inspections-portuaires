// src/auth/auth.module.ts - AJOUTER TypeOrmModule

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard'; // ✅ AJOUT
import { Utilisateur } from '../entities/utilisateur.entity';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([Utilisateur]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard], // ✅ AJOUT RolesGuard
  exports: [AuthService, JwtAuthGuard, RolesGuard], // ✅ AJOUT RolesGuard dans exports
})
export class AuthModule {}