import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateActifDto, UpdateActifDto } from './dto/actif.dto';
import { Actif } from '../entities/actif.entity';

@Injectable()
export class ActifService {
  constructor(
    @InjectRepository(Actif)
    private actifRepository: Repository<Actif>,
  ) {}

  async create(createActifDto: CreateActifDto): Promise<Actif> {
    const actif = this.actifRepository.create(createActifDto);
    return await this.actifRepository.save(actif);
  }

  async findAll(): Promise<Actif[]> {
    return await this.actifRepository.find({
      relations: ['groupe']
    });
  }

  async findOne(id: number): Promise<Actif> {
    const actif = await this.actifRepository.findOne({
      where: { id },
      relations: ['groupe']
    });
    
    if (!actif) {
      throw new NotFoundException(`Actif avec l'ID ${id} non trouvé`);
    }
    
    return actif;
  }

  async findByGroupe(idGroupe: number): Promise<Actif[]> {
    return await this.actifRepository.find({
      where: { idGroupe },
      relations: ['groupe']
    });
  }

  async findBySite(site: string): Promise<Actif[]> {
    return await this.actifRepository.find({
      where: { site },
      relations: ['groupe']
    });
  }

  async update(id: number, updateActifDto: UpdateActifDto): Promise<Actif> {
    const actif = await this.findOne(id);
    Object.assign(actif, updateActifDto);
    return await this.actifRepository.save(actif);
  }

  async remove(id: number): Promise<void> {
    const actif = await this.findOne(id);
    await this.actifRepository.remove(actif);
  }

  async updateIndiceEtat(id: number, nouvelIndice: number): Promise<Actif> {
    const actif = await this.findOne(id);
    actif.indiceEtat = nouvelIndice;
    return await this.actifRepository.save(actif);
  }
}