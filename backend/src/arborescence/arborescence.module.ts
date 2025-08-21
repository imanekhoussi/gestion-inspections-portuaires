// src/arborescence/arborescence.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArborescenceController } from './arborescence.controller';
import { ArborescenceService } from './arborescence.service';
import { Famille } from '../entities/famille.entity';
import { Groupe } from '../entities/groupe.entity';
import { Actif } from '../entities/actif.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Famille, Groupe, Actif]),
  ],
  controllers: [ArborescenceController],
  providers: [ArborescenceService],
})
export class ArborescenceModule {}