import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGroupeDto, UpdateGroupeDto } from './dto/groupe.dto';
import { Groupe } from '../entities/groupe.entity';

@Injectable()
export class GroupeService {
  constructor(
    @InjectRepository(Groupe)
    private groupeRepository: Repository<Groupe>,
  ) {}

  async create(createGroupeDto: CreateGroupeDto): Promise<Groupe> {
    const groupe = this.groupeRepository.create(createGroupeDto);
    return await this.groupeRepository.save(groupe);
  }

  async findAll(): Promise<Groupe[]> {
    return await this.groupeRepository.find({
      relations: ['famille', 'actifs', 'typesInspection']
    });
  }

  async findOne(id: number): Promise<Groupe> {
    const groupe = await this.groupeRepository.findOne({
      where: { id },
      relations: ['famille', 'actifs', 'typesInspection']
    });
    
    if (!groupe) {
      throw new NotFoundException(`Groupe avec l'ID ${id} non trouvé`);
    }
    
    return groupe;
  }

  async update(id: number, updateGroupeDto: UpdateGroupeDto): Promise<Groupe> {
    const groupe = await this.findOne(id);
    Object.assign(groupe, updateGroupeDto);
    return await this.groupeRepository.save(groupe);
  }

  async remove(id: number): Promise<void> {
    const groupe = await this.findOne(id);
    await this.groupeRepository.remove(groupe);
  }
}