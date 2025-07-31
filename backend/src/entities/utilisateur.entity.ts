// src/entities/utilisateur.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum RoleUtilisateur {
  OPERATEUR = 'operateur',
  MAITRE_OUVRAGE = 'maitre_ouvrage',
  ADMIN = 'admin'
}

@Entity('utilisateur')
export class Utilisateur {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  nom: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'enum', enum: RoleUtilisateur })
  role: RoleUtilisateur;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephone: string;

  @Column({ name: 'photo_profil', type: 'varchar', length: 255, nullable: true })
  photoProfil: string;
}
