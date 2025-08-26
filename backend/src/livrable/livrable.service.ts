// src/livrable/livrable.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Livrable } from '../entities/livrable.entity';
import { CreateLivrableDto, UpdateLivrableDto } from './dto/livrable.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LivrableService {
  constructor(
    @InjectRepository(Livrable)
    private livrableRepository: Repository<Livrable>
  ) {}

  async create(createLivrableDto: CreateLivrableDto, insertBy: number): Promise<Livrable> {
    const livrable = this.livrableRepository.create({
      ...createLivrableDto,
      insertBy
    });
    return await this.livrableRepository.save(livrable);
  }

  async findAll(): Promise<Livrable[]> {
    return await this.livrableRepository.find({
      relations: ['inspection', 'inserteur']
    });
  }

  async findOne(id: number): Promise<Livrable> {
    const livrable = await this.livrableRepository.findOne({
      where: { id },
      relations: ['inspection', 'inserteur']
    });
    
    if (!livrable) {
      throw new NotFoundException(`Livrable avec l'ID ${id} non trouvé`);
    }
    
    return livrable;
  }

  async findByInspection(idInspection: number): Promise<Livrable[]> {
    return await this.livrableRepository.find({
      where: { idInspection },
      relations: ['inserteur']
    });
  }

  async downloadFile(id: number) {
    const livrable = await this.findOne(id);
    const filePath = path.join('./uploads/livrables', livrable.currentName);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Fichier non trouvé sur le serveur');
    }

    return {
      filePath,
      originalName: livrable.originalName,
      mimeType: this.getMimeType(livrable.originalName)
    };
  }

  async update(id: number, updateLivrableDto: UpdateLivrableDto): Promise<Livrable> {
    const livrable = await this.findOne(id);
    Object.assign(livrable, updateLivrableDto);
    return await this.livrableRepository.save(livrable);
  }

  async remove(id: number): Promise<void> {
    const livrable = await this.findOne(id);
    
    // Supprimer le fichier physique
    const filePath = path.join('./uploads/livrables', livrable.currentName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    await this.livrableRepository.remove(livrable);
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.txt': 'text/plain',
      '.zip': 'application/zip'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
}