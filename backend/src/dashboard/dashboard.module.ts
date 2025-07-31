import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
// ✅ AJOUT: Importer les entités nécessaires
import { Inspection } from '../entities/inspection.entity';
import { Actif } from '../entities/actif.entity';

@Module({
  imports: [
    // ✅ CORRECTION: Ajouter les entités que DashboardService utilise
    TypeOrmModule.forFeature([Inspection, Actif])
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}