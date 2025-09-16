// src/app/features/log-historique/components/log-detail-dialog/log-detail-dialog.component.ts
// Version avec améliorations incrémentales basée sur votre code existant

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { LogHistorique } from '../../../../core/models/log-historique.interface';
import { LogHistoriqueService } from '../../services/log-historique.service';

@Component({
  selector: 'app-log-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatCardModule
  ],
  templateUrl: './log-detail-dialog.component.html',
  styleUrls: ['./log-detail-dialog.component.scss']
})
export class LogDetailDialogComponent {
  // Nouvelles propriétés pour les améliorations
  showTechnicalDetails = false;
  isImportant = false;

  constructor(
    public dialogRef: MatDialogRef<LogDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LogHistorique,
    private logService: LogHistoriqueService
  ) {
    // Initialiser si le log est marqué comme important
    this.isImportant = (this.data as any)?.isImportant || false;
  }

  // Méthodes existantes (gardées telles quelles)
  formatDate(date: Date | string): string {
    return this.logService.formatDate(date);
  }

  getEtatBadgeClass(etat: string): string {
    return this.logService.getEtatBadgeClass(etat);
  }

  viewInspectionHistory(): void {
    if (this.data.inspection) {
      this.dialogRef.close({ action: 'viewInspection', inspectionId: this.data.inspection.id });
    }
  }

  viewUserActivity(): void {
    if (this.data.intervenant) {
      this.dialogRef.close({ action: 'viewUser', userId: this.data.intervenant.id });
    }
  }

  // === NOUVELLES MÉTHODES POUR LES AMÉLIORATIONS ===

  /**
   * Retourne un label descriptif du type d'action
   */
  getActionTypeLabel(): string {
    if (!this.data.ancienEtat && this.data.nouvelEtat) {
      return 'Création d\'inspection';
    }
    if (this.data.ancienEtat && !this.data.nouvelEtat) {
      return 'Suppression d\'inspection';
    }
    if (this.data.ancienEtat && this.data.nouvelEtat) {
      return 'Modification d\'état';
    }
    return 'Action sur inspection';
  }

  /**
   * Retourne la classe CSS pour le chip de type de log
   */
  getLogTypeChipClass(): string {
    if (!this.data.ancienEtat && this.data.nouvelEtat) return 'creation';
    if (this.data.ancienEtat && !this.data.nouvelEtat) return 'suppression';
    if (this.data.nouvelEtat?.toLowerCase().includes('valid')) return 'validation';
    return 'modification';
  }

  /**
   * Retourne l'icône appropriée pour le type de log
   */
  getLogTypeIcon(): string {
    if (!this.data.ancienEtat && this.data.nouvelEtat) return 'add_circle';
    if (this.data.ancienEtat && !this.data.nouvelEtat) return 'remove_circle';
    if (this.data.nouvelEtat?.toLowerCase().includes('valid')) return 'verified';
    return 'edit';
  }

  /**
   * Retourne le label du type de log
   */
  getLogTypeLabel(): string {
    if (!this.data.ancienEtat && this.data.nouvelEtat) return 'Création';
    if (this.data.ancienEtat && !this.data.nouvelEtat) return 'Suppression';
    if (this.data.nouvelEtat?.toLowerCase().includes('valid')) return 'Validation';
    return 'Modification';
  }

  /**
   * Calcule et affiche le temps relatif (il y a X minutes/heures/jours)
   */
  getRelativeTime(date: Date | string): string {
    const now = new Date();
    const logDate = new Date(date);
    const diffMs = now.getTime() - logDate.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 30) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    
    return 'Il y a plus d\'un mois';
  }

  /**
   * Retourne l'icône appropriée pour un état donné
   */
  getStateIcon(etat: string | null): string {
    if (!etat) return 'help_outline';
    
    const etatLower = etat.toLowerCase();
    const stateIcons: { [key: string]: string } = {
      'en_cours': 'play_circle',
      'en-cours': 'play_circle',
      'programmee': 'schedule',
      'programmée': 'schedule',
      'cloturee': 'check_circle',
      'clôturée': 'check_circle',
      'validee': 'verified',
      'validée': 'verified',
      'annulee': 'cancel',
      'annulée': 'cancel',
      'suspendue': 'pause_circle',
      'en_attente': 'hourglass_empty',
      'en-attente': 'hourglass_empty'
    };

    return stateIcons[etatLower] || 'info';
  }

  /**
   * Formate le texte de l'état de manière plus lisible
   */
  formatStateText(etat: string | null): string {
    if (!etat) return 'Non défini';
    
    return etat.replace(/_/g, ' ')
               .split(' ')
               .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
               .join(' ');
  }

  /**
   * Analyse l'impact du changement et retourne un message explicatif
   */
  getChangeImpact(): string | null {
    const ancien = this.data.ancienEtat?.toLowerCase();
    const nouveau = this.data.nouvelEtat?.toLowerCase();

    // Création
    if (!ancien && nouveau) {
      return 'Nouvelle inspection créée dans le système';
    }

    // Suppression
    if (ancien && !nouveau) {
      return 'Inspection supprimée du système';
    }

    // Progression positive
    if (ancien === 'programmee' && nouveau === 'en_cours') {
      return 'Inspection démarrée selon la planification';
    }

    if (ancien === 'en_cours' && nouveau === 'cloturee') {
      return 'Inspection terminée avec succès';
    }

    if (nouveau === 'validee') {
      return 'Inspection validée - processus finalisé';
    }

    // Régression
    if (nouveau === 'annulee') {
      return 'Inspection annulée - action requise';
    }

    return null;
  }

  /**
   * Retourne l'icône d'impact du changement
   */
  getImpactIcon(): string {
    const nouveau = this.data.nouvelEtat?.toLowerCase();
    
    if (nouveau === 'validee' || nouveau === 'cloturee') return 'trending_up';
    if (nouveau === 'annulee') return 'trending_down';
    if (!this.data.ancienEtat && nouveau) return 'add';
    
    return 'trending_flat';
  }

  /**
   * Retourne la classe CSS pour l'icône d'impact
   */
  getImpactIconClass(): string {
    const nouveau = this.data.nouvelEtat?.toLowerCase();
    
    if (nouveau === 'validee' || nouveau === 'cloturee') return 'positive';
    if (nouveau === 'annulee') return 'negative';
    
    return 'neutral';
  }

  
  toggleTechnicalDetails(): void {
    this.showTechnicalDetails = !this.showTechnicalDetails;
  }


  

 
}