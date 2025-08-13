// src/entities/actif.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinColumn } from 'typeorm';
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

  // CORRECTION: Le nom de la colonne en BDD est 'id_groupe'
  // Mais on veut l'utiliser comme 'idGroupe' dans le code
  @Column({ name: 'id_groupe' })
  idGroupe: number;

  // CORRECTION: Le nom de la colonne en BDD est 'indice_etat'
  // Mais on veut l'utiliser comme 'indiceEtat' dans le code
  @Column({ name: 'indice_etat', type: 'int' })
  indiceEtat: number;

  // CORRECTION: Géométrie PostGIS - colonne 'geometry'
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Geometry', // Supporte Point, LineString, Polygon
    nullable: true,
  })
  geometry: any;

  @ManyToOne(() => Groupe, groupe => groupe.actifs)
  @JoinColumn({ name: 'id_groupe' })
  groupe: Groupe;

  @ManyToMany(() => Inspection, inspection => inspection.actifs)
  inspections: Inspection[];
}