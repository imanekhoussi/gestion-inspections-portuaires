import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Between } from 'typeorm';
import { Inspection, EtatInspection } from '../entities/inspection.entity';
import { CreateInspectionDto, UpdateInspectionDto } from './dto/inspection.dto';
import { Actif } from '../entities/actif.entity';

// Add the missing interface definition
interface FindAllOptions {
  page: number;
  limit: number;
  search?: string;
  idType?: number;
  etat?: EtatInspection;
  dateMin?: Date;
  dateMax?: Date;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class InspectionService {
  constructor(
    @InjectRepository(Inspection)
    private inspectionRepository: Repository<Inspection>,
   
  ) {}

  async findAll(options: FindAllOptions): Promise<any> {
  const { page = 1, limit = 10, search, idType, etat, sortBy = 'id', sortOrder = 'DESC' } = options;

  try {
    // Basic query without problematic joins
    const queryBuilder = this.inspectionRepository
      .createQueryBuilder('inspection')
      .leftJoinAndSelect('inspection.typeInspection', 'typeInspection')
      .leftJoinAndSelect('inspection.createur', 'createur');

    // Safe search
    if (search?.trim()) {
      queryBuilder.andWhere(
        '(LOWER(inspection.titre) LIKE LOWER(:search) OR LOWER(typeInspection.nom) LIKE LOWER(:search))',
        { search: `%${search.trim()}%` }
      );
    }

    // Safe filters
    if (idType && !isNaN(Number(idType))) {
      queryBuilder.andWhere('inspection.idType = :idType', { idType: Number(idType) });
    }

    if (etat) {
      queryBuilder.andWhere('inspection.etat = :etat', { etat });
    }

    // Safe sorting
    const validFields = ['id', 'titre', 'dateDebut', 'dateFin', 'etat'];
    const safeSortBy = validFields.includes(sortBy) ? sortBy : 'id';
    const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    
    queryBuilder.orderBy(`inspection.${safeSortBy}`, safeSortOrder);

    // Get count and data
    const total = await queryBuilder.getCount();
    const safeLimit = Math.min(Math.max(Number(limit), 1), 100);
    const safePage = Math.max(Number(page), 1);
    
    queryBuilder
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    const data = await queryBuilder.getMany();

    // Load actifs separately to avoid join issues
    const inspectionsWithActifs = await Promise.all(
      data.map(async (inspection) => {
        const withActifs = await this.inspectionRepository.findOne({
          where: { id: inspection.id },
          relations: ['actifs']
        });
        return { ...inspection, actifs: withActifs?.actifs || [] };
      })
    );

    return {
      data: inspectionsWithActifs,
      total,
      page: safePage,
      limit: safeLimit,
      lastPage: Math.ceil(total / safeLimit)
    };

  } catch (error) {
    console.error('Query failed, using fallback:', error);
    
    // Fallback to simple query
    const fallbackData = await this.inspectionRepository.find({
      relations: ['typeInspection', 'createur'],
      take: 10,
      order: { id: 'DESC' }
    });

    return {
      data: fallbackData,
      total: fallbackData.length,
      page: 1,
      limit: 10,
      lastPage: 1
    };
  }
}


  async findByCalendar(startDate: Date, endDate: Date): Promise<any[]> {
    const inspections = await this.inspectionRepository.find({
      where: {
        dateDebut: Between(startDate, endDate),
      },
    });

    // Map the inspections to the format the Angular frontend expects
    return inspections.map((inspection) => {
      let statusString: 'Planifiée' | 'Terminée' | 'Annulée' | 'Rejetée' | 'Autre' = 'Autre';

      switch (inspection.etat) {
        case EtatInspection.PROGRAMMEE:
          statusString = 'Planifiée';
          break;
        case EtatInspection.VALIDEE:
          statusString = 'Terminée';
          break;
        case EtatInspection.REJETEE:
          statusString = 'Rejetée';
          break;
        case EtatInspection.CLOTUREE:
          statusString = 'Annulée';
          break;
      }

      return {
        id: inspection.id.toString(),
        title: inspection.titre,
        start: inspection.dateDebut,
        end: inspection.dateFin,
        status: statusString,
      };
    });
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
    const inspections = await this.inspectionRepository
      .createQueryBuilder('inspection')
      .leftJoinAndSelect('inspection.actifs', 'actifs')
      .leftJoinAndSelect('inspection.typeInspection', 'type')
      .where('inspection.createdBy = :operateurId', { operateurId })
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