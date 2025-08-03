import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inspection, EtatInspection } from '../entities/inspection.entity';
import { CreateInspectionDto, UpdateInspectionDto } from './dto/inspection.dto';
import { Actif } from '../entities/actif.entity';

@Injectable()
export class InspectionService {
  constructor(
    @InjectRepository(Inspection)
    private inspectionRepository: Repository<Inspection>,
   
  ) {}

  async findAll(options: { page: number; limit: number }): Promise<any> {
  const { page, limit } = options;
  const [data, total] = await this.inspectionRepository.findAndCount({
    take: limit,
    skip: (page - 1) * limit,
    relations: ['typeInspection', 'actifs', 'createur', 'validateur', 'livrables'],
    order: { id: 'DESC' } // Optional: order by newest
  });

  return {
    data,
    total,
    page,
    limit,
    lastPage: Math.ceil(total / limit)
  };
}

  async findByCalendar(startDate: Date, endDate: Date): Promise<Inspection[]> {
    return this.inspectionRepository
      .createQueryBuilder('inspection')
      .leftJoinAndSelect('inspection.typeInspection', 'typeInspection')
      .leftJoinAndSelect('inspection.actifs', 'actifs')
      .where('inspection.dateDebut BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getMany();
  }

  async create(createInspectionDto: CreateInspectionDto, userId: number): Promise<Inspection> {
    const inspection = this.inspectionRepository.create({
      ...createInspectionDto,
      etat: EtatInspection.PROGRAMMEE,
      createdBy: userId,
    });
    
    const savedInspection = await this.inspectionRepository.save(inspection);

    return savedInspection;
  }

  async cloturer(id: number, userId: number, commentaire?: string): Promise<Inspection> {
    const inspection = await this.findOne(id);
    const ancienEtat = inspection.etat;
    
    if (inspection.etat !== EtatInspection.EN_COURS) {
      throw new BadRequestException('Seules les inspections en cours peuvent être clôturées');
    }

    inspection.etat = EtatInspection.CLOTUREE;
    inspection.cloturedBy = userId;
    inspection.cloturedAt = new Date();
    if (commentaire) {
      inspection.commentaireCloture = commentaire;
    }

    const savedInspection = await this.inspectionRepository.save(inspection);

    return savedInspection;
  }

  async valider(id: number, userId: number, commentaire?: string): Promise<Inspection> {
    const inspection = await this.findOne(id);
    const ancienEtat = inspection.etat;
    
    if (inspection.etat !== EtatInspection.CLOTUREE) {
      throw new BadRequestException('Seules les inspections clôturées peuvent être validées');
    }

    inspection.etat = EtatInspection.VALIDEE;
    inspection.validatedBy = userId;
    inspection.validatedAt = new Date();
    if (commentaire) {
      inspection.commentaireValidation = commentaire;
    }

    const savedInspection = await this.inspectionRepository.save(inspection);

    return savedInspection;
  }

  async rejeter(id: number, userId: number, motif: string): Promise<Inspection> {
    const inspection = await this.findOne(id);
    const ancienEtat = inspection.etat;
    
    if (inspection.etat !== EtatInspection.CLOTUREE) {
      throw new BadRequestException('Seules les inspections clôturées peuvent être rejetées');
    }

    inspection.etat = EtatInspection.REJETEE;
    inspection.rejectedBy = userId;
    inspection.rejectedAt = new Date();
    inspection.motifRejet = motif;

    const savedInspection = await this.inspectionRepository.save(inspection);

    return savedInspection;
  }

  async reprogrammer(id: number, nouvelleDate: Date, userId: number): Promise<Inspection> {
    const inspection = await this.findOne(id);
    const ancienEtat = inspection.etat;
    
    if (inspection.etat !== EtatInspection.REJETEE) {
      throw new BadRequestException('Seules les inspections rejetées peuvent être reprogrammées');
    }

    inspection.etat = EtatInspection.PROGRAMMEE;
    inspection.dateDebut = nouvelleDate;
    inspection.rejectedBy = null;
    inspection.rejectedAt = null;
    inspection.motifRejet = null;

    const savedInspection = await this.inspectionRepository.save(inspection);

    return savedInspection;
  }

  private async findOne(id: number): Promise<Inspection> {
    const inspection = await this.inspectionRepository.findOne({
      where: { id },
      relations: ['typeInspection', 'actifs', 'createur', 'validateur', 'livrables'],
    });
    
    if (!inspection) {
      throw new NotFoundException(`Inspection avec l'ID ${id} non trouvée`);
    }
    
    return inspection;
  }
  // Inspections par zone
async findByZone(site?: string, zone?: string): Promise<Inspection[]> {
  const query = this.inspectionRepository
    .createQueryBuilder('inspection')
    .leftJoinAndSelect('inspection.actifs', 'actifs')
    .leftJoinAndSelect('inspection.typeInspection', 'typeInspection')
    .leftJoinAndSelect('actifs.groupe', 'groupe')
    .leftJoinAndSelect('groupe.famille', 'famille');

  if (site) {
    query.andWhere('actifs.site = :site', { site });
  }

  if (zone) {
    query.andWhere('actifs.zone = :zone', { zone });
  }

  return await query.getMany();
}

// Données de planification avec carte
async getPlanificationMap(): Promise<any[]> {
  const inspections = await this.inspectionRepository
    .createQueryBuilder('inspection')
    .select([
      'inspection.id',
      'inspection.titre',
      'inspection.dateDebut',
      'inspection.dateFin', 
      'inspection.etat',
      'type.nom as typeNom',
      'ST_X(actifs.geometry) as lng',
      'ST_Y(actifs.geometry) as lat',
      'actifs.nom as actifNom',
      'actifs.site',
      'actifs.zone'
    ])
    .leftJoin('inspection.typeInspection', 'type')
    .leftJoin('inspection.actifs', 'actifs')
    .where('actifs.geometry IS NOT NULL')
    .andWhere('inspection.etat IN (:...etats)', { 
      etats: ['programmee', 'en_cours'] 
    })
    .getRawMany();

  return inspections.map(insp => ({
    id: insp.inspection_id,
    titre: insp.inspection_titre,
    dateDebut: insp.inspection_dateDebut,
    dateFin: insp.inspection_dateFin,
    etat: insp.inspection_etat,
    type: insp.typeNom,
    actif: {
      nom: insp.actifNom,
      site: insp.actifs_site,
      zone: insp.actifs_zone,
      coordinates: [parseFloat(insp.lng), parseFloat(insp.lat)]
    },
    urgence: this.calculateUrgence(insp.inspection_dateFin)
  }));
}

// Inspections d'un opérateur avec localisation
async getInspectionsOperateur(operateurId: number): Promise<any[]> {
  // Note: Il faudrait ajouter un champ 'assignedTo' dans l'entité Inspection
  const inspections = await this.inspectionRepository
    .createQueryBuilder('inspection')
    .leftJoinAndSelect('inspection.actifs', 'actifs')
    .leftJoinAndSelect('inspection.typeInspection', 'type')
    .where('inspection.createdBy = :operateurId', { operateurId })
    .orWhere('inspection.assigned_to = :operateurId', { operateurId }) // Si ajouté
    .andWhere('inspection.etat IN (:...etats)', { 
      etats: ['programmee', 'en_cours'] 
    })
    .getMany();

  return inspections.map(inspection => ({
    ...inspection,
    actifsAvecCoordonnees: inspection.actifs.filter(actif => actif.geometry),
    distanceTotale: this.calculateTotalDistance(inspection.actifs)
  }));
}

private calculateUrgence(dateFin: Date): 'high' | 'medium' | 'low' {
  const now = new Date();
  const diffDays = Math.ceil((dateFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 1) return 'high';
  if (diffDays <= 7) return 'medium';
  return 'low';
}


private calculateTotalDistance(actifs: Actif[]): number {
  let totalDistance = 0;
  
  for (let i = 0; i < actifs.length - 1; i++) {
    if (actifs[i].geometry?.coordinates && actifs[i + 1].geometry?.coordinates) {
      const coords1 = actifs[i].geometry!.coordinates;
      const coords2 = actifs[i + 1].geometry!.coordinates;
      
      totalDistance += this.calculateDistance(
        coords1[1], coords1[0], // lat1, lng1
        coords2[1], coords2[0]  // lat2, lng2
      );
    }
  }
  
  return totalDistance;
}

private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Rayon de la Terre en mètres
  const dLat = this.toRadians(lat2 - lat1);
  const dLng = this.toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

private toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
}