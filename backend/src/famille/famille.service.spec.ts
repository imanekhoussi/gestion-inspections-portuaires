import { Test, TestingModule } from '@nestjs/testing';
import { FamilleService } from './famille.service';

describe('FamilleService', () => {
  let service: FamilleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FamilleService],
    }).compile();

    service = module.get<FamilleService>(FamilleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
