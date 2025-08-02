// src/app/features/admin/services/notification-admin.service.ts

import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationAdmin } from '../../../core/models/admin.interfaces';

export interface ToastConfig {
  duration?: number;
  position?: 'top' | 'bottom';
  action?: string;
  autoClose?: boolean;
  showIcon?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationAdminService {
  private notificationsSubject = new BehaviorSubject<NotificationAdmin[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private readonly defaultConfig: MatSnackBarConfig = {
    duration: 4000,
    horizontalPosition: 'right',
    verticalPosition: 'top',
    panelClass: []
  };

  constructor(private snackBar: MatSnackBar) {}

  // ===== MÉTHODES PUBLIQUES POUR LES TOASTS =====

  /**
   * Affiche un message de succès
   */
  showSuccess(message: string, config?: ToastConfig): MatSnackBarRef<SimpleSnackBar> {
    return this.showToast(message, 'success', {
      ...config,
      action: config?.action || '✓'
    });
  }

  /**
   * Affiche un message d'erreur
   */
  showError(message: string, config?: ToastConfig): MatSnackBarRef<SimpleSnackBar> {
    return this.showToast(message, 'error', {
      ...config,
      duration: config?.duration || 6000,
      action: config?.action || '✗'
    });
  }

  /**
   * Affiche un message d'avertissement
   */
  showWarning(message: string, config?: ToastConfig): MatSnackBarRef<SimpleSnackBar> {
    return this.showToast(message, 'warning', {
      ...config,
      action: config?.action || '⚠'
    });
  }

  /**
   * Affiche un message d'information
   */
  showInfo(message: string, config?: ToastConfig): MatSnackBarRef<SimpleSnackBar> {
    return this.showToast(message, 'info', {
      ...config,
      action: config?.action || 'ℹ'
    });
  }

  /**
   * Affiche un message de chargement
   */
  showLoading(message: string = 'Chargement en cours...'): MatSnackBarRef<SimpleSnackBar> {
    return this.showToast(message, 'info', {
      duration: 0, // Pas de fermeture automatique
      action: '⟳'
    });
  }

  /**
   * Affiche un toast de confirmation avec actions
   */
  showConfirmation(
    message: string, 
    confirmAction: () => void, 
    cancelAction?: () => void
  ): MatSnackBarRef<SimpleSnackBar> {
    const snackBarRef = this.showToast(message, 'warning', {
      duration: 8000,
      action: 'Confirmer'
    });

    snackBarRef.onAction().subscribe(() => {
      confirmAction();
    });

    snackBarRef.afterDismissed().subscribe((info) => {
      if (info.dismissedByAction === false && cancelAction) {
        cancelAction();
      }
    });

    return snackBarRef;
  }

  // ===== MÉTHODES PRIVÉES =====

  private showToast(
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info',
    config?: ToastConfig
  ): MatSnackBarRef<SimpleSnackBar> {
    const snackBarConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      duration: config?.duration ?? this.defaultConfig.duration,
      panelClass: [...(this.defaultConfig.panelClass || []), `toast-${type}`]
    };

    // Ajustement de la position si spécifiée
    if (config?.position) {
      snackBarConfig.verticalPosition = config.position;
    }

    return this.snackBar.open(
      message,
      config?.action || 'OK',
      snackBarConfig
    );
  }

  // ===== GESTION DES NOTIFICATIONS PERSISTANTES =====

  /**
   * Ajoute une notification persistante
   */
  addNotification(notification: Omit<NotificationAdmin, 'id' | 'timestamp' | 'lu'>): void {
    const newNotification: NotificationAdmin = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
      lu: false
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([newNotification, ...currentNotifications]);

    // Afficher aussi un toast pour les notifications importantes
    if (notification.type === 'error' || notification.type === 'warning') {
      this.showToast(notification.titre, notification.type);
    }
  }

  /**
   * Marque une notification comme lue
   */
  markAsRead(notificationId: string): void {
    const notifications = this.notificationsSubject.value.map(n => 
      n.id === notificationId ? { ...n, lu: true } : n
    );
    this.notificationsSubject.next(notifications);
  }

  /**
   * Marque toutes les notifications comme lues
   */
  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value.map(n => ({ ...n, lu: true }));
    this.notificationsSubject.next(notifications);
  }

  /**
   * Supprime une notification
   */
  removeNotification(notificationId: string): void {
    const notifications = this.notificationsSubject.value.filter(n => n.id !== notificationId);
    this.notificationsSubject.next(notifications);
  }

  /**
   * Supprime toutes les notifications
   */
  clearAllNotifications(): void {
    this.notificationsSubject.next([]);
  }

  /**
   * Supprime les notifications lues
   */
  clearReadNotifications(): void {
    const notifications = this.notificationsSubject.value.filter(n => !n.lu);
    this.notificationsSubject.next(notifications);
  }

  // ===== GETTERS =====

  /**
   * Retourne le nombre de notifications non lues
   */
  getUnreadCount(): Observable<number> {
    return new Observable(observer => {
      this.notifications$.subscribe(notifications => {
        const unreadCount = notifications.filter(n => !n.lu).length;
        observer.next(unreadCount);
      });
    });
  }

  /**
   * Retourne les notifications non lues
   */
  getUnreadNotifications(): Observable<NotificationAdmin[]> {
    return new Observable(observer => {
      this.notifications$.subscribe(notifications => {
        const unread = notifications.filter(n => !n.lu);
        observer.next(unread);
      });
    });
  }

  // ===== MÉTHODES UTILITAIRES =====

  /**
   * Génère un ID unique pour les notifications
   */
  private generateId(): string {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ferme toutes les snackbars ouvertes
   */
  dismissAll(): void {
    this.snackBar.dismiss();
  }

  // ===== MÉTHODES SPÉCIALISÉES POUR L'ADMIN =====

  /**
   * Notification pour les opérations CRUD réussies
   */
  showCrudSuccess(operation: 'création' | 'modification' | 'suppression', entity: string): void {
    const messages = {
      création: `${entity} créé(e) avec succès`,
      modification: `${entity} modifié(e) avec succès`,
      suppression: `${entity} supprimé(e) avec succès`
    };

    this.showSuccess(messages[operation]);
  }

  /**
   * Notification pour les erreurs CRUD
   */
  showCrudError(operation: 'création' | 'modification' | 'suppression', entity: string, error?: string): void {
    const messages = {
      création: `Erreur lors de la création de ${entity}`,
      modification: `Erreur lors de la modification de ${entity}`,
      suppression: `Erreur lors de la suppression de ${entity}`
    };

    const message = error ? `${messages[operation]}: ${error}` : messages[operation];
    this.showError(message);
  }

  /**
   * Notification pour les validations
   */
  showValidationError(field: string, message?: string): void {
    const defaultMessage = `Le champ "${field}" contient une erreur`;
    this.showWarning(message || defaultMessage);
  }

  /**
   * Notification pour les permissions insuffisantes
   */
  showPermissionError(): void {
    this.showError('Vous n\'avez pas les permissions nécessaires pour effectuer cette action');
  }

  /**
   * Notification pour les timeouts de connexion
   */
  showConnectionError(): void {
    this.showError('Problème de connexion. Veuillez vérifier votre connexion internet.');
  }

  /**
   * Notification pour les sauvegardes automatiques
   */
  showAutoSave(): void {
    this.showInfo('Sauvegarde automatique effectuée', { duration: 2000 });
  }

  /**
   * Notification pour les exports de données
   */
  showExportSuccess(filename?: string): void {
    const message = filename 
      ? `Export terminé: ${filename}` 
      : 'Export des données terminé avec succès';
    this.showSuccess(message);
  }

  /**
   * Notification pour les imports de données
   */
  showImportSuccess(count: number, entity: string): void {
    this.showSuccess(`${count} ${entity}(s) importé(s) avec succès`);
  }

  /**
   * Notification pour les synchronisations
   */
  showSyncSuccess(): void {
    this.showSuccess('Synchronisation terminée');
  }

  /**
   * Notification pour les changements d'état
   */
  showStatusChange(entity: string, oldStatus: string, newStatus: string): void {
    this.showInfo(`${entity}: ${oldStatus} → ${newStatus}`);
  }

  /**
   * Notification pour les rappels/alertes
   */
  showReminder(message: string, actionRoute?: string): void {
    this.addNotification({
      type: 'warning',
      titre: 'Rappel',
      message,
      action: actionRoute ? {
        libelle: 'Voir détails',
        route: actionRoute
      } : undefined
    });
  }
}