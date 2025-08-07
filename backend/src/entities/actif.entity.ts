// src/entities/actif.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinColumn } from 'typeorm';
import { Point } from 'geojson'; 
import { Groupe } from './groupe.entity';
import { Inspection } from './inspection.entity';

@Entity('actif')
export class Actif {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  site: string;

  @Column({ type: 'varchar', length: 255 })
  zone: string;

  @Column({ type: 'varchar', length: 255 })
  ouvrage: string;

  @Column({ type: 'varchar', length: 255 })
  nom: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ name: 'id_groupe' })
  idGroupe: number;

  @Column({ name: 'indice_etat', type: 'int', default: 1 })
  indiceEtat: number;

  @Column({
    type: 'geometry',
    srid: 26191, // Merchich / Nord Maroc coordinate system
    nullable: true,
  })
  geometry: Point | null;

  @ManyToOne(() => Groupe, groupe => groupe.actifs)
  @JoinColumn({ name: 'id_groupe' })
  groupe: Groupe;

  @ManyToMany(() => Inspection, inspection => inspection.actifs)
  inspections: Inspection[];
}