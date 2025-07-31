import { Test, TestingModule } from '@nestjs/testing';
import { ActifService } from './actif.service';

describe('ActifService', () => {
  let service: ActifService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActifService],
    }).compile();

    service = module.get<ActifService>(ActifService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
