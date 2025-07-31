import { Module } from '@nestjs/common';
import { LivrableService } from './livrable.service';
import { LivrableController } from './livrable.controller';

@Module({
  providers: [LivrableService],
  controllers: [LivrableController]
})
export class LivrableModule {}
