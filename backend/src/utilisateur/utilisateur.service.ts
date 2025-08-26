
// src/utilisateur/utilisateur.service.ts 

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Utilisateur } from '../entities/utilisateur.entity';
import { CreateUtilisateurDto, UpdateUtilisateurDto } from './dto/utilisateur.dto';

import * as bcrypt from 'bcrypt';
import { IsNull } from 'typeorm'; 

@Injectable()
export class UtilisateurService {
  constructor(
    @InjectRepository(Utilisateur)
    private utilisateurRepository: Repository<Utilisateur>
  ) {}

  async create(createUtilisateurDto: CreateUtilisateurDto, createdBy: number): Promise<Utilisateur> {
    // Vérifier si l'email existe déjà
    const existingUser = await this.utilisateurRepository.findOne({
      where: { email: createUtilisateurDto.email }
    });
    
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(createUtilisateurDto.password, 10);
    
    const utilisateur = this.utilisateurRepository.create({
      ...createUtilisateurDto,
      password: hashedPassword
    });
    
    const savedUser = await this.utilisateurRepository.save(utilisateur);

    
    return savedUser;
  }

  async findAll(): Promise<Utilisateur[]> {
  return await this.utilisateurRepository.find({
    where: { deletedAt: IsNull() }, // This is the new line
    select: ['id', 'nom', 'email', 'role', 'telephone', 'photoProfil']
  });
}

  async findOne(id: number): Promise<Utilisateur> {
    const utilisateur = await this.utilisateurRepository.findOne({
      where: { id },
      select: ['id', 'nom', 'email', 'role', 'telephone', 'photoProfil']
    });
    
    if (!utilisateur) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }
    
    return utilisateur;
  }

  async findByEmail(email: string): Promise<Utilisateur | null> {
    return await this.utilisateurRepository.findOne({
      where: { email }
    });
  }

  async update(id: number, updateUtilisateurDto: UpdateUtilisateurDto, updatedBy: number): Promise<Utilisateur> {
    const utilisateur = await this.findOne(id);
    const ancienEtat = { ...utilisateur };
    
    // Si le mot de passe est modifié, le hasher
    if (updateUtilisateurDto.password) {
      updateUtilisateurDto.password = await bcrypt.hash(updateUtilisateurDto.password, 10);
    }
    
    Object.assign(utilisateur, updateUtilisateurDto);
    const updatedUser = await this.utilisateurRepository.save(utilisateur);

    

    return updatedUser;
  }

  async remove(id: number, deletedBy: number): Promise<void> {
    const utilisateur = await this.findOne(id);
    
    

    await this.utilisateurRepository.softRemove(utilisateur);
  }
}
