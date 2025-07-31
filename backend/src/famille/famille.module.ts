import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Famille } from '../entities/famille.entity';
import { FamilleController } from './famille.controller';
import { FamilleService } from './famille.service';

@Module({
  imports: [TypeOrmModule.forFeature([Famille])],
  controllers: [FamilleController],
  providers: [FamilleService],
  exports: [FamilleService],
})
export class FamilleModule {}