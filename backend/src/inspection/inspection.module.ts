import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inspection } from '../entities/inspection.entity';
import { Actif } from '../entities/actif.entity';
import { TypeInspection } from '../entities/type-inspection.entity';
import { Utilisateur } from '../entities/utilisateur.entity';
import { InspectionController } from './inspection.controller';
import { InspectionService } from './inspection.service';
import { LogHistoriqueModule } from '../log-historique/log-historique.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inspection, 
      Actif, 
      TypeInspection, 
      Utilisateur
    ]),
    LogHistoriqueModule 
  ],
  controllers: [InspectionController],
  providers: [InspectionService],
  exports: [InspectionService],
})
export class InspectionModule {}