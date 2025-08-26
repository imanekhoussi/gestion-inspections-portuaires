// src/livrable/livrable.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { LivrableService } from './livrable.service';
import { LivrableController } from './livrable.controller';
import { Livrable } from '../entities/livrable.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Livrable]),
    MulterModule.register({
      dest: './uploads/livrables',
    }),
  ],
  providers: [LivrableService],
  controllers: [LivrableController],
  exports: [LivrableService]
})
export class LivrableModule {}