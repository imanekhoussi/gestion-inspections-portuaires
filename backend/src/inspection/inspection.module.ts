import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inspection } from '../entities/inspection.entity';
import { InspectionController } from './inspection.controller';
import { InspectionService } from './inspection.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inspection]) 
  ],
  controllers: [InspectionController],
  providers: [InspectionService], 
  exports: [InspectionService],
})
export class InspectionModule {}

