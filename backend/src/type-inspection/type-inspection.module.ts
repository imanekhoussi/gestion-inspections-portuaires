// src/type-inspection/type-inspection.module.ts - REMPLACER COMPLÈTEMENT

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeInspectionService } from './type-inspection.service';
import { TypeInspectionController } from './type-inspection.controller';
import { TypeInspection } from '../entities/type-inspection.entity';
import { LogHistoriqueModule } from '../log-historique/log-historique.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TypeInspection]),
    LogHistoriqueModule
  ],
  providers: [TypeInspectionService],
  controllers: [TypeInspectionController],
  exports: [TypeInspectionService]
})
export class TypeInspectionModule {}