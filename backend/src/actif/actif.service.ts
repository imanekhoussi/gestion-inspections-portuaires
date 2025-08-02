import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { CreateActifDto, UpdateActifDto } from './dto/actif.dto';
import { Actif } from '../entities/actif.entity';
import { LogHistoriqueService } from '../log-historique/log-historique.service';
import { TypeAction, TypeEntite } from '../entities/log-historique.entity';

@Injectable()
export class ActifService {
  constructor(
    @InjectRepository(Actif)
    private actifRepository: Repository<Actif>,
    private logService: LogHistoriqueService,
  ) {}

  async create(createActifDto: CreateActifDto, createdBy: number): Promise<Actif> {
    const { latitude, longitude, ...actifData } = createActifDto;
    
    const geometry: { type: 'Point'; coordinates: [number, number] } | null = 
      (latitude && longitude) ? {
        type: 'Point',
        coordinates: [longitude, latitude]
      } : null;

    const actif = this.actifRepository.create({
      ...actifData,
      geometry
    });

    const savedActif = await this.actifRepository.save(actif);

    await this.logService.enregistrerLog(
      TypeAction.CREATION,
      TypeEntite.ACTIF,
      savedActif.id,
      createdBy,
      null,
      { 
        nom: savedActif.nom, 
        site: savedActif.site, 
        zone: savedActif.zone,
        hasCoordinates: !!geometry
      },
      `Création de l'actif ${savedActif.nom}`
    );

    return savedActif;
  }

  async findAll(): Promise<Actif[]> {
    return await this.actifRepository.find({
      relations: ['groupe', 'groupe.famille']
    });
  }

  async findOne(id: number): Promise<Actif> {
    const actif = await this.actifRepository.findOne({
      where: { id },
      relations: ['groupe', 'groupe.famille']
    });
    
    if (!actif) {
      throw new NotFoundException(`Actif avec l'ID ${id} non trouvé`);
    }
    
    return actif;
  }

  async findByGroupe(idGroupe: number): Promise<Actif[]> {
    return await this.actifRepository.find({
      where: { idGroupe },
      relations: ['groupe']
    });
  }

  async findBySite(site: string): Promise<Actif[]> {
    return await this.actifRepository.find({
      where: { site },
      relations: ['groupe']
    });
  }

  async update(id: number, updateActifDto: UpdateActifDto, updatedBy: number): Promise<Actif> {
    const actif = await this.findOne(id);
    const ancienEtat = { 
      nom: actif.nom, 
      site: actif.site, 
      zone: actif.zone, 
      indiceEtat: actif.indiceEtat 
    };

    const { latitude, longitude, ...restUpdateData } = updateActifDto;
    const updateData: any = { ...restUpdateData };
    
    if (latitude && longitude) {
      updateData.geometry = {
        type: 'Point' as const,
        coordinates: [longitude, latitude]
      };
    }
    
    Object.assign(actif, updateData);
    const updatedActif = await this.actifRepository.save(actif);

    await this.logService.enregistrerLog(
      TypeAction.MODIFICATION,
      TypeEntite.ACTIF,
      id,
      updatedBy,
      ancienEtat,
      { 
        nom: updatedActif.nom, 
        site: updatedActif.site, 
        zone: updatedActif.zone, 
        indiceEtat: updatedActif.indiceEtat 
      },
      `Modification de l'actif ${updatedActif.nom}`
    );

    return updatedActif;
  }

  async remove(id: number, deletedBy: number): Promise<void> {
    const actif = await this.findOne(id);
    
    await this.logService.enregistrerLog(
      TypeAction.SUPPRESSION,
      TypeEntite.ACTIF,
      id,
      deletedBy,
      { nom: actif.nom, site: actif.site, zone: actif.zone },
      null,
      `Suppression de l'actif ${actif.nom}`
    );

    await this.actifRepository.remove(actif);
  }

  async updateIndiceEtat(id: number, nouvelIndice: number, updatedBy: number): Promise<Actif> {
    const actif = await this.findOne(id);
    const ancienIndice = actif.indiceEtat;
    
    actif.indiceEtat = nouvelIndice;
    const updatedActif = await this.actifRepository.save(actif);

    await this.logService.enregistrerLog(
      TypeAction.CHANGEMENT_ETAT,
      TypeEntite.ACTIF,
      id,
      updatedBy,
      { indiceEtat: ancienIndice },
      { indiceEtat: nouvelIndice },
      `Changement d'indice d'état: ${ancienIndice} → ${nouvelIndice}`
    );

    return updatedActif;
  }

  async findByCoordinates(lat: number, lng: number, radius: number): Promise<Actif[]> {
    const actifs = await this.findAll();

    return actifs.filter(actif => {
      if (!actif.geometry || !actif.geometry.coordinates) return false;
      
      const [actifLng, actifLat] = actif.geometry.coordinates;
      const distance = this.calculateDistance(lat, lng, actifLat, actifLng);
      
      return distance <= radius;
    });
  }

  async getMapData(): Promise<any[]> {
    const actifs = await this.findAll();

    return actifs
      .filter(actif => actif.geometry && actif.geometry.coordinates)
      .map(actif => ({
        id: actif.id,
        nom: actif.nom,
        site: actif.site,
        zone: actif.zone,
        indiceEtat: actif.indiceEtat,
        coordinates: actif.geometry ? actif.geometry.coordinates : [0, 0],
        groupe: actif.groupe?.nom,
        famille: actif.groupe?.famille?.nom,
        status: actif.indiceEtat >= 4 ? 'good' : 
                actif.indiceEtat >= 2 ? 'warning' : 'critical'
      }));
  }

  async getStatisticsByZone(): Promise<any[]> {
    const result = await this.actifRepository
      .createQueryBuilder('actif')
      .select([
        'actif.site as site',
        'actif.zone as zone',
        'COUNT(*) as total',
        'AVG(actif.indiceEtat) as indiceEtatMoyen',
        'SUM(CASE WHEN actif.indiceEtat >= 4 THEN 1 ELSE 0 END) as bonEtat',
        'SUM(CASE WHEN actif.indiceEtat < 2 THEN 1 ELSE 0 END) as etatCritique'
      ])
      .groupBy('actif.site, actif.zone')
      .getRawMany();

    return result.map(item => ({
      site: item.site,
      zone: item.zone,
      total: parseInt(item.total),
      indiceEtatMoyen: parseFloat(item.indiceEtatMoyen).toFixed(2),
      bonEtat: parseInt(item.bonEtat),
      etatCritique: parseInt(item.etatCritique)
    }));
  }

  // ✅ UNE SEULE MÉTHODE calculateTotalDistance
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