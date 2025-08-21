// src/entities/groupe.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Famille } from './famille.entity';
import { Actif } from './actif.entity';
import { TypeInspection } from './type-inspection.entity';

@Entity('groupe')
export class Groupe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  nom: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ name: 'id_famille' })
  idFamille: number;

  @ManyToOne(() => Famille, famille => famille.groupes)
  @JoinColumn({ name: 'id_famille' })
  famille: Famille;

  @OneToMany(() => Actif, actif => actif.groupe)
  actifs: Actif[];

  @OneToMany(() => TypeInspection, typeInspection => typeInspection.groupe)
  typesInspection: TypeInspection[];
   nbActifs: number;
}