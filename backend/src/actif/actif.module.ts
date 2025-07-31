// actif.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActifService } from './actif.service';
import { ActifController } from './actif.controller';
import { Actif } from '../entities/actif.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Actif])],
  providers: [ActifService],
  controllers: [ActifController],
  exports: [ActifService]
})
export class ActifModule {}