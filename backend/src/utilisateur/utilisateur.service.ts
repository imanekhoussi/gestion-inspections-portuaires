// ===== 4. UTILISATEUR SERVICE CORRECT =====
// src/utilisateur/utilisateur.service.ts - CRÉER CE FICHIER

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Utilisateur } from '../entities/utilisateur.entity';
import { CreateUtilisateurDto, UpdateUtilisateurDto } from './dto/utilisateur.dto';
import { LogHistoriqueService } from '../log-historique/log-historique.service';
import { TypeAction, TypeEntite } from '../entities/log-historique.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UtilisateurService {
  constructor(
    @InjectRepository(Utilisateur)
    private utilisateurRepository: Repository<Utilisateur>,
    private logService: LogHistoriqueService,
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

    // Log de création
    await this.logService.enregistrerLog(
      TypeAction.CREATION,
      TypeEntite.UTILISATEUR,
      savedUser.id,
      createdBy,
      null,
      { nom: savedUser.nom, email: savedUser.email, role: savedUser.role },
      `Création de l'utilisateur ${savedUser.nom}`
    );

    return savedUser;
  }

  async findAll(): Promise<Utilisateur[]> {
    return await this.utilisateurRepository.find({
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

    // Log de modification
    await this.logService.enregistrerLog(
      TypeAction.MODIFICATION,
      TypeEntite.UTILISATEUR,
      id,
      updatedBy,
      ancienEtat,
      { nom: updatedUser.nom, email: updatedUser.email, role: updatedUser.role },
      `Modification de l'utilisateur ${updatedUser.nom}`
    );

    return updatedUser;
  }

  async remove(id: number, deletedBy: number): Promise<void> {
    const utilisateur = await this.findOne(id);
    
    // Log de suppression
    await this.logService.enregistrerLog(
      TypeAction.SUPPRESSION,
      TypeEntite.UTILISATEUR,
      id,
      deletedBy,
      { nom: utilisateur.nom, email: utilisateur.email, role: utilisateur.role },
      null,
      `Suppression de l'utilisateur ${utilisateur.nom}`
    );

    await this.utilisateurRepository.remove(utilisateur);
  }
}
