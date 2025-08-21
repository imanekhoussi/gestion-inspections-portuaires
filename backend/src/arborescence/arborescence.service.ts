// src/arborescence/arborescence.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Famille } from '../entities/famille.entity';
import { Groupe } from '../entities/groupe.entity';
import { Actif } from '../entities/actif.entity';

// --- INTERFACES DEFINED LOCALLY ---
interface ActifMetadata {
  site: string;
  zone?: string;
  ouvrage?: string;
}

interface ArborescenceNode {
  id: number;
  nom: string;
  code: string;
  type: 'famille' | 'groupe' | 'actif';
  metadata?: any;
  enfants?: ArborescenceNode[];
}

interface ArborescenceResponse {
  familles: ArborescenceNode[];
  totalFamilles: number;
  totalGroupes: number;
  totalActifs: number;
}
// ------------------------------------

@Injectable()
export class ArborescenceService {
  constructor(
    @InjectRepository(Famille)
    private readonly familleRepository: Repository<Famille>,
    @InjectRepository(Groupe)
    private readonly groupeRepository: Repository<Groupe>,
    @InjectRepository(Actif)
    private readonly actifRepository: Repository<Actif>,
  ) {}

  async getArborescence(): Promise<ArborescenceResponse> {
    const [familles, groupes, actifs] = await Promise.all([
      this.familleRepository.find(),
      this.groupeRepository.find(),
      this.actifRepository.find(),
    ]);

    const actifsByGroupeId = new Map<number, ArborescenceNode[]>();
    for (const actif of actifs) {
      if (!actifsByGroupeId.has(actif.idGroupe)) {
        actifsByGroupeId.set(actif.idGroupe, []);
      }
      actifsByGroupeId.get(actif.idGroupe)!.push({
        id: actif.id,
        nom: actif.nom,
        code: actif.code,
        type: 'actif',
        metadata: {
          site: actif.site,
          zone: actif.zone,
          ouvrage: actif.ouvrage,
        },
        enfants: [],
      });
    }

    const groupesByFamilleId = new Map<number, ArborescenceNode[]>();
    for (const groupe of groupes) {
      if (!groupesByFamilleId.has(groupe.idFamille)) {
        groupesByFamilleId.set(groupe.idFamille, []);
      }
      const enfantsActifs = actifsByGroupeId.get(groupe.id) || [];
      groupesByFamilleId.get(groupe.idFamille)!.push({
        id: groupe.id,
        nom: groupe.nom,
        code: groupe.code,
        type: 'groupe',
        metadata: {
          nbActifs: enfantsActifs.length,
        },
        enfants: enfantsActifs,
      });
    }

    const familleNodes: ArborescenceNode[] = familles.map(famille => {
      const enfantsGroupes = groupesByFamilleId.get(famille.id) || [];
      const nbActifs = enfantsGroupes.reduce((sum, g) => sum + (g.metadata.nbActifs || 0), 0);
      
      return {
        id: famille.id,
        nom: famille.nom,
        code: famille.code,
        type: 'famille',
        metadata: {
          nbGroupes: enfantsGroupes.length,
          nbActifs: nbActifs,
        },
        enfants: enfantsGroupes,
      };
    });

    return {
      familles: familleNodes,
      totalFamilles: familles.length,
      totalGroupes: groupes.length,
      totalActifs: actifs.length,
    };
  }
}