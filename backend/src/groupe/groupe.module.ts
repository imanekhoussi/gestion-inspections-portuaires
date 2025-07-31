import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupeService } from './groupe.service';
import { GroupeController } from './groupe.controller';
import { Groupe } from '../entities/groupe.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Groupe])],
  providers: [GroupeService],
  controllers: [GroupeController],
  exports: [GroupeService] // Export si d'autres modules ont besoin de ce service
})
export class GroupeModule {}