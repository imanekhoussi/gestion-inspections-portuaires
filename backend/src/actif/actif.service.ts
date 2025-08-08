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

  /**
   * Creates a new asset.
   * This method now handles geometry data (Point, LineString, Polygon)
   * sent from the frontend drawing tool.
   */
  async create(createActifDto: CreateActifDto, createdBy: number): Promise<Actif> {
    // Destructure the DTO to separate geometry parts from the rest of the data
    const { geometryType, coordinates, ...actifData } = createActifDto;

    let geometryForDb = null;
    // Check if both geometry type and coordinates are provided
    if (geometryType && coordinates) {
        // Construct a valid GeoJSON object here on the backend
        const geoJsonObject = {
            type: geometryType,
            coordinates: coordinates,
        };
        const geoJsonString = JSON.stringify(geoJsonObject);

        // This query securely converts the GeoJSON text into a native PostGIS geometry
        // and reprojects it from WGS84 (4326) to your local system (26191)
        const queryResult = await this.actifRepository.query(
            `SELECT ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), 26191) as geom`,
            [geoJsonString]
        );
        geometryForDb = queryResult[0].geom;
    }

    const newActif = this.actifRepository.create({
      ...actifData,
      geometry: geometryForDb,
    });

    const savedActif = await this.actifRepository.save(newActif);

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
        hasGeometry: !!geometryForDb
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

  async getActifsAsGeoJSON(): Promise<any> {
    const query = this.actifRepository
      .createQueryBuilder('actif')
      .select([
        'actif.id as id',
        'actif.nom as nom',
        'actif.site as site',
        'actif.zone as zone',
        'actif.indiceEtat as "indiceEtat"',
        'ST_AsGeoJSON(ST_Transform(actif.geometry, 4326)) as geometry',
      ])
      .where('actif.geometry IS NOT NULL');

    const results = await query.getRawMany();

    const features = results.map((item: any) => ({
      type: 'Feature',
      geometry: JSON.parse(item.geometry),
      properties: {
        id: item.id,
        nom: item.nom,
        site: item.site,
        zone: item.zone,
        indiceEtat: item.indiceEtat,
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
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

    // This update logic will need to be adapted similarly to the create method
    // if you want to allow geometry updates in the future.
    const { geometryType, coordinates, ...restUpdateData } = updateActifDto;
    const updateData: any = { ...restUpdateData };

    if (geometryType && coordinates) {
      const geoJsonObject = { type: geometryType, coordinates: coordinates };
      const geoJsonString = JSON.stringify(geoJsonObject);
      const queryResult = await this.actifRepository.query(
          `SELECT ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), 26191) as geom`,
          [geoJsonString]
      );
      updateData.geometry = queryResult[0].geom;
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

  async findByCoordinates(lat: number, lng: number, radius: number): Promise<Actif[]> {
    const origin = {
        type: 'Point',
        coordinates: [lng, lat],
    };
    const geoJsonString = JSON.stringify(origin);

    // Using ST_DWithin for efficient geographic search in the database
    const query = this.actifRepository
      .createQueryBuilder('actif')
      .where(`ST_DWithin(
          ST_Transform(actif.geometry, 4326)::geography,
          ST_SetSRID(ST_GeomFromGeoJSON(:origin), 4326)::geography,
          :radius
      )`, { origin: geoJsonString, radius: radius })
      .setParameters({ origin: geoJsonString, radius });

    return await query.getMany();
  }


}