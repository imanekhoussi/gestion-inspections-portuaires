
// src/entities/famille.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Groupe } from './groupe.entity';

@Entity('famille')
export class Famille {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  nom: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @OneToMany(() => Groupe, groupe => groupe.famille)
  groupes: Groupe[];
}