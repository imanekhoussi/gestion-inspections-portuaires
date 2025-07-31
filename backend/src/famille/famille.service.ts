import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Famille } from '../entities/famille.entity';
import { CreateFamilleDto, UpdateFamilleDto } from './dto/famille.dto';

@Injectable()
export class FamilleService {
  constructor(
    @InjectRepository(Famille)
    private familleRepository: Repository<Famille>,
  ) {}

  async findAll(): Promise<Famille[]> {
    return this.familleRepository.find({
      relations: ['groupes'],
    });
  }

  async findOne(id: number): Promise<Famille> {
    const famille = await this.familleRepository.findOne({
      where: { id },
      relations: ['groupes'],
    });
    
    if (!famille) {
      throw new NotFoundException(`Famille avec l'ID ${id} non trouvée`);
    }
    
    return famille;
  }

  async create(createFamilleDto: CreateFamilleDto): Promise<Famille> {
    const famille = this.familleRepository.create(createFamilleDto);
    return this.familleRepository.save(famille);
  }

  async update(id: number, updateFamilleDto: UpdateFamilleDto): Promise<Famille> {
    await this.familleRepository.update(id, updateFamilleDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.familleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Famille avec l'ID ${id} non trouvée`);
    }
  }
}
