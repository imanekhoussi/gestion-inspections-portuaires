import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inspection, EtatInspection } from '../entities/inspection.entity';
import { CreateInspectionDto, UpdateInspectionDto } from './dto/inspection.dto';

@Injectable()
export class InspectionService {
  constructor(
    @InjectRepository(Inspection)
    private inspectionRepository: Repository<Inspection>,
   
  ) {}

  async findAll(): Promise<Inspection[]> {
    return this.inspectionRepository.find({
      relations: ['typeInspection', 'actifs', 'createur', 'validateur', 'livrables'],
    });
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
}