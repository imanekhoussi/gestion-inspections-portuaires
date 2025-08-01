// src/groupe/groupe.module.ts - REMPLACER COMPLÈTEMENT (SEULEMENT LE MODULE)

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupeService } from './groupe.service';
import { GroupeController } from './groupe.controller';
import { Groupe } from '../entities/groupe.entity';
import { LogHistoriqueModule } from '../log-historique/log-historique.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Groupe]),
    LogHistoriqueModule
  ],
  providers: [GroupeService],
  controllers: [GroupeController],
  exports: [GroupeService]
})
export class GroupeModule {}


