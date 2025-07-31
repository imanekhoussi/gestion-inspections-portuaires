import { Test, TestingModule } from '@nestjs/testing';
import { TypeInspectionService } from './type-inspection.service';

describe('TypeInspectionService', () => {
  let service: TypeInspectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TypeInspectionService],
    }).compile();

    service = module.get<TypeInspectionService>(TypeInspectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
