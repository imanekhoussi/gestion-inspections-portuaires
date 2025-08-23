import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Inspection, EtatInspection } from '../entities/inspection.entity';
import { CreateInspectionDto, UpdateInspectionDto } from './dto/inspection.dto';
import { Actif } from '../entities/actif.entity';

@Injectable()
export class InspectionService {
  constructor(
    @InjectRepository(Inspection)
    private inspectionRepository: Repository<Inspection>,
    @InjectRepository(Actif)
    private actifRepository: Repository<Actif>,
  ) {}

  async findAll(options: { page: number; limit: number }): Promise<any> {
    const { page, limit } = options;
    const [data, total] = await this.inspectionRepository.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      relations: ['typeInspection', 'actifs', 'createur'],
      order: { id: 'DESC' }
    });

    // Map actifs to actifIds for frontend compatibility
    const mappedData = data.map(inspection => ({
      ...inspection,
      actifIds: inspection.actifs?.map(actif => actif.id) || []
    }));

    return {
      data: mappedData,
      total,
      page,
      limit,
      lastPage: Math.ceil(total / limit)
    };
  }

  async findByCalendar(startDate: Date, endDate: Date): Promise<any[]> {
    const inspections = await this.inspectionRepository.find({
      where: {
        dateDebut: Between(startDate, endDate),
      },
    });

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
    const { actifIds, dateDebut, dateFin, ...inspectionData } = createInspectionDto;

    // Convert string dates to Date objects
    const startDate = new Date(dateDebut);
    const endDate = new Date(dateFin);

    // Validate dates
    if (startDate >= endDate) {
      throw new BadRequestException('La date de début doit être antérieure à la date de fin');
    }

    // Find the actifs to associate (if any provided)
    let actifs: Actif[] = [];
    if (actifIds && actifIds.length > 0) {
      actifs = await this.actifRepository.find({
        where: { id: In(actifIds) }
      });
      
      if (actifs.length !== actifIds.length) {
        const foundIds = actifs.map(a => a.id);
        const missingIds = actifIds.filter(id => !foundIds.includes(id));
        throw new BadRequestException(`Actifs non trouvés: ${missingIds.join(', ')}`);
      }
    }

    // Create inspection with actifs relationship
    const inspection = this.inspectionRepository.create({
      ...inspectionData,
      dateDebut: startDate,
      dateFin: endDate,
      etat: EtatInspection.PROGRAMMEE,
      createdBy: userId,
      actifs: actifs, // TypeORM will handle the junction table automatically
    });

    // Save the inspection (this will also save the many-to-many relationships)
    const savedInspection = await this.inspectionRepository.save(inspection);

    // Return the inspection with all relations loaded
    const inspectionWithRelations = await this.inspectionRepository.findOne({
      where: { id: savedInspection.id },
      relations: ['typeInspection', 'actifs', 'createur']
    });

    if (!inspectionWithRelations) {
      throw new BadRequestException('Erreur lors de la récupération de l\'inspection créée');
    }

    return inspectionWithRelations;
  }

  async cloturer(id: number, userId: number, commentaire?: string): Promise<Inspection> {
    const inspection = await this.findOne(id);
    
    if (inspection.etat !== EtatInspection.EN_COURS) {
      throw new BadRequestException('Seules les inspections en cours peuvent être clôturées');
    }

    inspection.etat = EtatInspection.CLOTUREE;
    inspection.cloturedBy = userId;
    inspection.cloturedAt = new Date();
    if (commentaire) {
      inspection.commentaireCloture = commentaire;
    }

    return await this.inspectionRepository.save(inspection);
  }

  async valider(id: number, userId: number, commentaire?: string): Promise<Inspection> {
    const inspection = await this.findOne(id);
    
    if (inspection.etat !== EtatInspection.CLOTUREE) {
      throw new BadRequestException('Seules les inspections clôturées peuvent être validées');
    }

    inspection.etat = EtatInspection.VALIDEE;
    inspection.validatedBy = userId;
    inspection.validatedAt = new Date();
    if (commentaire) {
      inspection.commentaireValidation = commentaire;
    }

    return await this.inspectionRepository.save(inspection);
  }

  async rejeter(id: number, userId: number, motif: string): Promise<Inspection> {
    const inspection = await this.findOne(id);
    
    if (inspection.etat !== EtatInspection.CLOTUREE) {
      throw new BadRequestException('Seules les inspections clôturées peuvent être rejetées');
    }

    inspection.etat = EtatInspection.REJETEE;
    inspection.rejectedBy = userId;
    inspection.rejectedAt = new Date();
    inspection.motifRejet = motif;

    return await this.inspectionRepository.save(inspection);
  }

  async reprogrammer(id: number, nouvelleDate: Date, userId: number): Promise<Inspection> {
    const inspection = await this.findOne(id);
    
    if (inspection.etat !== EtatInspection.REJETEE) {
      throw new BadRequestException('Seules les inspections rejetées peuvent être reprogrammées');
    }

    inspection.etat = EtatInspection.PROGRAMMEE;
    inspection.dateDebut = nouvelleDate;
    inspection.rejectedBy = null;
    inspection.rejectedAt = null;
    inspection.motifRejet = null;

    return await this.inspectionRepository.save(inspection);
  }

  private async findOne(id: number): Promise<Inspection> {
    const inspection = await this.inspectionRepository.findOne({
      where: { id },
      relations: ['typeInspection', 'actifs', 'createur']
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
          coords1[1], coords1[0],
          coords2[1], coords2[0]
        );
      }
    }
    
    return totalDistance;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
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