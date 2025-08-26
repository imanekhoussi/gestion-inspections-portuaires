import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateActifDto, UpdateActifDto } from './dto/actif.dto';
import { Actif } from '../entities/actif.entity';

@Injectable()
export class ActifService {
  private readonly logger = new Logger(ActifService.name);

  constructor(
    @InjectRepository(Actif)
    private actifRepository: Repository<Actif>,
  ) {}

  async create(createActifDto: CreateActifDto, createdBy: number): Promise<Actif> {
    this.logger.log(`=== CRÉATION ACTIF ===`);
    this.logger.log(`Données: ${JSON.stringify(createActifDto, null, 2)}`);
    
    try {
      // Validation des données obligatoires
      const { nom, code, site, zone, ouvrage, idGroupe } = createActifDto;
      
      if (!nom || !code || !site || !zone || !ouvrage || !idGroupe) {
        throw new BadRequestException('Données obligatoires manquantes');
      }

      // Vérifier que le code n'existe pas déjà
      const existingActif = await this.actifRepository.findOne({ where: { code } });
      if (existingActif) {
        throw new BadRequestException(`Un actif avec le code "${code}" existe déjà`);
      }

      // Séparer géométrie et données de base
      const { geometryType, coordinates, ...actifData } = createActifDto;

      let geometryForDb: any = null;
      
      // 🔥 TRAITEMENT DE LA GÉOMÉTRIE CORRIGÉ
      if (geometryType && coordinates) {
        try {
          const geoJsonObject = {
            type: geometryType,
            coordinates: coordinates,
          };
          this.logger.log(`GeoJSON: ${JSON.stringify(geoJsonObject)}`);

          // ✅ TypeORM gère automatiquement la conversion GeoJSON → PostGIS
          geometryForDb = geoJsonObject;
          this.logger.log('✅ Géométrie assignée directement');
        } catch (geoError) {
          this.logger.error(`Erreur géométrie: ${geoError.message}`);
        }
      }

      // Création de l'actif
      const newActif = this.actifRepository.create({
        nom: actifData.nom,
        code: actifData.code,
        site: actifData.site,
        zone: actifData.zone,
        ouvrage: actifData.ouvrage,
        idGroupe: actifData.idGroupe,
        indiceEtat: actifData.indiceEtat || 3, // Valeur par défaut
        geometry: geometryForDb,
      });

      this.logger.log(`Entité créée: ${JSON.stringify({
        nom: newActif.nom,
        code: newActif.code,
        site: newActif.site,
        zone: newActif.zone,
        ouvrage: newActif.ouvrage,
        idGroupe: newActif.idGroupe,
        indiceEtat: newActif.indiceEtat,
        hasGeometry: !!newActif.geometry
      }, null, 2)}`);

      // Sauvegarde
      const savedActif = await this.actifRepository.save(newActif);
      this.logger.log(`✅ Actif sauvegardé - ID: ${savedActif.id}`);

     

      return savedActif;

    } catch (error) {
      this.logger.error(`❌ ERREUR: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      throw error;
    }
  }

  async findAll(): Promise<Actif[]> {
    this.logger.log('🔍 Récupération de tous les actifs...');
    try {
      const actifs = await this.actifRepository.find({
        relations: ['groupe']
      });
      this.logger.log(`✅ ${actifs.length} actifs trouvés`);
      return actifs;
    } catch (error) {
      this.logger.error(`❌ Erreur récupération: ${error.message}`);
      throw error;
    }
  }

  async getActifsAsGeoJSON(): Promise<any> {
    try {
      // Adaptation à  structure de BDD
      const query = this.actifRepository
        .createQueryBuilder('actif')
        .select([
          'actif.id as id',
          'actif.nom as nom',
          'actif.site as site',
          'actif.zone as zone',
          'actif.ouvrage as ouvrage',
          'actif.code as code',
          'actif.indice_etat as "indiceEtat"',
          'ST_AsGeoJSON(actif.geometry) as geometry',
        ])
        .where('actif.geometry IS NOT NULL');

      const results = await query.getRawMany();

      const features = results.map((item: any) => ({
        type: 'Feature',
        geometry: item.geometry ? JSON.parse(item.geometry) : null,
        properties: {
          id: item.id,
          nom: item.nom,
          code: item.code,
          site: item.site,
          zone: item.zone,
          ouvrage: item.ouvrage,
          indiceEtat: item.indiceEtat,
        },
      }));

      return {
        type: 'FeatureCollection',
        features,
      };
    } catch (error) {
      this.logger.error(`Erreur GeoJSON: ${error.message}`);
      return {
        type: 'FeatureCollection',
        features: [],
      };
    }
  }

  async findOne(id: number): Promise<Actif> {
    const actif = await this.actifRepository.findOne({
      where: { id },
      relations: ['groupe']
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
    
    const { geometryType, coordinates, ...updateData } = updateActifDto;
    Object.assign(actif, updateData);
    
    return await this.actifRepository.save(actif);
  }

  async remove(id: number, deletedBy: number): Promise<void> {
    const actif = await this.findOne(id);
    await this.actifRepository.remove(actif);
  }

  async updateIndiceEtat(id: number, nouvelIndice: number, updatedBy: number): Promise<Actif> {
    const actif = await this.findOne(id);
    actif.indiceEtat = nouvelIndice;
    return await this.actifRepository.save(actif);
  }

  async getStatisticsByZone(): Promise<any[]> {
    const result = await this.actifRepository
      .createQueryBuilder('actif')
      .select([
        'actif.site as site',
        'actif.zone as zone',
        'COUNT(*) as total',
        'AVG(actif.indice_etat) as indiceEtatMoyen',
        'SUM(CASE WHEN actif.indice_etat >= 4 THEN 1 ELSE 0 END) as bonEtat',
        'SUM(CASE WHEN actif.indice_etat <= 2 THEN 1 ELSE 0 END) as etatCritique'
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

  async findByCoordinates(lat: number, lng: number, radius: number): Promise<Actif[]> {
    return await this.actifRepository.find({
      where: {},
      take: 10 
    });
  }
}