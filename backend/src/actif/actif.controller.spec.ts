import { Test, TestingModule } from '@nestjs/testing';
import { ActifController } from './actif.controller';

describe('ActifController', () => {
  let controller: ActifController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActifController],
    }).compile();

    controller = module.get<ActifController>(ActifController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
