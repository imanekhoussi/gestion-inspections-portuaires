// src/utilisateur/utilisateur.module.ts - REMPLACER COMPLÈTEMENT (SEULEMENT LE MODULE)

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilisateurService } from './utilisateur.service';
import { UtilisateurController } from './utilisateur.controller';
import { Utilisateur } from '../entities/utilisateur.entity';
import { LogHistoriqueModule } from '../log-historique/log-historique.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Utilisateur]),
    LogHistoriqueModule
  ],
  providers: [UtilisateurService],
  controllers: [UtilisateurController],
  exports: [UtilisateurService]
})
export class UtilisateurModule {}

