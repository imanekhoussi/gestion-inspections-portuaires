import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, OneToMany, JoinColumn, JoinTable } from 'typeorm';
import { TypeInspection } from './type-inspection.entity';
import { Actif } from './actif.entity';
import { Utilisateur } from './utilisateur.entity';
import { Livrable } from './livrable.entity';

export enum EtatInspection {
  PROGRAMMEE = 'programmee',
  EN_COURS = 'en_cours',
  CLOTUREE = 'cloturee',
  VALIDEE = 'validee',
  REJETEE = 'rejetee'
}

@Entity('inspection')
export class Inspection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  titre: string;

  @Column({ name: 'id_type' })
  idType: number;

  @Column({ name: 'date_debut', type: 'date' })
  dateDebut: Date;

  @Column({ name: 'date_fin', type: 'date' })
  dateFin: Date;

  // ✅ CORRECTION: Utiliser ENUM au lieu de string
  @Column({ 
    type: 'enum', 
    enum: EtatInspection, 
    default: EtatInspection.PROGRAMMEE 
  })
  etat: EtatInspection;

  @Column({ name: 'created_by', type: 'integer', nullable: true })
createdBy: number | null;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

 @Column({ name: 'deleted_by', type: 'integer', nullable: true })
deletedBy: number | null;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'rejected_by', type: 'integer', nullable: true })
rejectedBy: number | null;

  @Column({ name: 'rejected_at', type: 'timestamp', nullable: true })
  rejectedAt: Date | null;

  @Column({ name: 'motif_rejet', type: 'text', nullable: true })
  motifRejet: string | null;

  @Column({ name: 'clotured_by', type: 'integer', nullable: true })
cloturedBy: number | null;

  @Column({ name: 'clotured_at', type: 'timestamp', nullable: true })
  cloturedAt: Date | null;

  @Column({ name: 'commentaire_cloture', type: 'text', nullable: true })
  commentaireCloture: string | null;

  @Column({ name: 'validated_by', type: 'integer', nullable: true })
validatedBy: number | null;

  @Column({ name: 'validated_at', type: 'timestamp', nullable: true })
  validatedAt: Date | null;

  @Column({ name: 'commentaire_validation', type: 'text', nullable: true })
  commentaireValidation: string | null;

  @ManyToOne(() => TypeInspection, typeInspection => typeInspection.inspections)
  @JoinColumn({ name: 'id_type' })
  typeInspection: TypeInspection;

  @ManyToMany(() => Actif, actif => actif.inspections)
  @JoinTable({
    name: 'inspection_actif',
    joinColumn: { name: 'id_inspection', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_actif', referencedColumnName: 'id' }
  })
  actifs: Actif[];

  @ManyToOne(() => Utilisateur, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createur: Utilisateur;

  @ManyToOne(() => Utilisateur, { nullable: true })
  @JoinColumn({ name: 'validated_by' })
  validateur: Utilisateur;

  @ManyToOne(() => Utilisateur, { nullable: true })
  @JoinColumn({ name: 'rejected_by' })
  rejeteur: Utilisateur;

  @OneToMany(() => Livrable, livrable => livrable.inspection)
  livrables: Livrable[];

  
}