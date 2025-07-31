// src/entities/livrable.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Inspection } from './inspection.entity';
import { Utilisateur } from './utilisateur.entity';

@Entity('livrable')
export class Livrable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_inspection' })
  idInspection: number;

  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName: string;

  @Column({ name: 'current_name', type: 'varchar', length: 255 })
  currentName: string;

  @Column({ type: 'bigint' })
  taille: number;

  @Column({ name: 'insert_by' })
  insertBy: number;

  @Column({ name: 'insert_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  insertAt: Date;

  @ManyToOne(() => Inspection, inspection => inspection.livrables)
  @JoinColumn({ name: 'id_inspection' })
  inspection: Inspection;

  @ManyToOne(() => Utilisateur)
  @JoinColumn({ name: 'insert_by' })
  inserteur: Utilisateur;
}
