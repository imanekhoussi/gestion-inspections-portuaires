import { Test, TestingModule } from '@nestjs/testing';
import { LivrableController } from './livrable.controller';

describe('LivrableController', () => {
  let controller: LivrableController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LivrableController],
    }).compile();

    controller = module.get<LivrableController>(LivrableController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
