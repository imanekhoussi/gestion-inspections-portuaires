import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActifService } from './actif.service';
import { ActifController } from './actif.controller';
import { Actif } from '../entities/actif.entity';
import { LogHistoriqueModule } from '../log-historique/log-historique.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Actif]),
    LogHistoriqueModule
  ],
  providers: [ActifService],
  controllers: [ActifController],
  exports: [ActifService]
})
export class ActifModule {}