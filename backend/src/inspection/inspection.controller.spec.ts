import { Test, TestingModule } from '@nestjs/testing';
import { InspectionController } from './inspection.controller';

describe('InspectionController', () => {
  let controller: InspectionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InspectionController],
    }).compile();

    controller = module.get<InspectionController>(InspectionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
