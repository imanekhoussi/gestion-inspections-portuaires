// src/famille/famille.module.ts - REMPLACER COMPLÈTEMENT

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Famille } from '../entities/famille.entity';
import { FamilleController } from './famille.controller';
import { FamilleService } from './famille.service';
import { LogHistoriqueModule } from '../log-historique/log-historique.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Famille]),
    LogHistoriqueModule
  ],
  controllers: [FamilleController],
  providers: [FamilleService],
  exports: [FamilleService],
})
export class FamilleModule {}