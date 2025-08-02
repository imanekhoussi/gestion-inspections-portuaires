// src/livrable/livrable.module.ts - REMPLACER COMPLÈTEMENT
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LivrableService } from './livrable.service';
import { LivrableController } from './livrable.controller';
import { Livrable } from '../entities/livrable.entity';
import { LogHistoriqueModule } from '../log-historique/log-historique.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Livrable]),
    LogHistoriqueModule
  ],
  providers: [LivrableService],
  controllers: [LivrableController],
  exports: [LivrableService]
})
export class LivrableModule {}