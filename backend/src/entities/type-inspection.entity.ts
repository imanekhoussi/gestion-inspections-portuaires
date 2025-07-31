// src/entities/type-inspection.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Groupe } from './groupe.entity';
import { Inspection } from './inspection.entity';

@Entity('type_inspection')
export class TypeInspection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  nom: string;

  @Column({ type: 'varchar', length: 100 })
  frequence: string;

  @Column({ name: 'id_groupe' })
  idGroupe: number;

  @ManyToOne(() => Groupe, groupe => groupe.typesInspection)
  @JoinColumn({ name: 'id_groupe' })
  groupe: Groupe;

  @OneToMany(() => Inspection, inspection => inspection.typeInspection)
  inspections: Inspection[];
}