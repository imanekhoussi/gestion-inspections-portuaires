import { Module } from '@nestjs/common';
import { ActifService } from './actif.service';
import { ActifController } from './actif.controller';

@Module({
  providers: [ActifService],
  controllers: [ActifController]
})
export class ActifModule {}
