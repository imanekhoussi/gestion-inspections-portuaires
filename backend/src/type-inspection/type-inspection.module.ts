import { Module } from '@nestjs/common';
import { TypeInspectionService } from './type-inspection.service';
import { TypeInspectionController } from './type-inspection.controller';

@Module({
  providers: [TypeInspectionService],
  controllers: [TypeInspectionController]
})
export class TypeInspectionModule {}
