import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Inspection, EtatInspection } from '../entities/inspection.entity';
import { Actif } from '../entities/actif.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Inspection)
    private inspectionRepository: Repository<Inspection>,
    @InjectRepository(Actif)
    private actifRepository: Repository<Actif>,
  ) {}

  async getKPIs() {
    const [
      totalInspections,
      inspectionsProgrammees,
      inspectionsRealisees,
      inspectionsValidees,
      inspectionsRejetees,
      totalActifs
    ] = await Promise.all([
      this.inspectionRepository.count(),
      this.inspectionRepository.count({ where: { etat: EtatInspection.PROGRAMMEE } }),
      this.inspectionRepository.count({ where: { etat: EtatInspection.CLOTUREE } }),
      this.inspectionRepository.count({ where: { etat: EtatInspection.VALIDEE } }),
      this.inspectionRepository.count({ where: { etat: EtatInspection.REJETEE } }),
      this.actifRepository.count(),
    ]);

    return {
      totalInspections,
      inspectionsProgrammees,
      inspectionsRealisees,
      inspectionsValidees,
      inspectionsRejetees,
      totalActifs,
      tauxConformite: totalInspections > 0 ? (inspectionsValidees / totalInspections) * 100 : 0,
    };
  }

  async getStatistiquesParFamille() {
    return this.inspectionRepository
      .createQueryBuilder('inspection')
      .leftJoin('inspection.typeInspection', 'typeInspection')
      .leftJoin('typeInspection.groupe', 'groupe')
      .leftJoin('groupe.famille', 'famille')
      .select('famille.nom', 'famille')
      .addSelect('inspection.etat', 'etat')
      .addSelect('COUNT(*)', 'nombre')
      .groupBy('famille.nom, inspection.etat')
      .getRawMany();
  }

  async getEvolutionIndicesEtat() {
    return this.actifRepository
      .createQueryBuilder('actif')
      .select('actif.indiceEtat', 'indice')
      .addSelect('COUNT(*)', 'nombre')
      .groupBy('actif.indiceEtat')
      .orderBy('actif.indiceEtat')
      .getRawMany();
  }

  async getActifsGeoJson() {
    // ✅ CORRECTION: Utiliser le bon nom de variable
    const actifsAvecCoordonnees = await this.actifRepository.find({
      where: {
        geometry: Not(IsNull())
      },
      relations: ['groupe', 'groupe.famille']
    });

    return {
      type: 'FeatureCollection',
      features: actifsAvecCoordonnees.map(actif => ({ // ✅ CORRECTION: Bon nom de variable
        type: 'Feature',
        properties: {
          id: actif.id,
          nom: actif.nom,
          code: actif.code,
          site: actif.site,
          zone: actif.zone,
          ouvrage: actif.ouvrage,
          indiceEtat: actif.indiceEtat,
          famille: actif.groupe?.famille?.nom || 'Non définie',
          groupe: actif.groupe?.nom || 'Non défini',
        },
        geometry: actif.geometry,
      })),
    };
  }
}
