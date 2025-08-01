// src/log-historique/log-historique.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogHistoriqueService } from './log-historique.service';
import { LogHistoriqueController } from './log-historique.controller';
import { LogHistorique } from '../entities/log-historique.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LogHistorique])],
  providers: [LogHistoriqueService],
  controllers: [LogHistoriqueController],
  exports: [LogHistoriqueService] // Export pour utiliser dans d'autres modules
})
export class LogHistoriqueModule {}