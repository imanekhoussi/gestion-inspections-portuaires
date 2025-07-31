import { Test, TestingModule } from '@nestjs/testing';
import { TypeInspectionController } from './type-inspection.controller';

describe('TypeInspectionController', () => {
  let controller: TypeInspectionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TypeInspectionController],
    }).compile();

    controller = module.get<TypeInspectionController>(TypeInspectionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
