import { Test, TestingModule } from '@nestjs/testing';
import { LivrableService } from './livrable.service';

describe('LivrableService', () => {
  let service: LivrableService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LivrableService],
    }).compile();

    service = module.get<LivrableService>(LivrableService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
