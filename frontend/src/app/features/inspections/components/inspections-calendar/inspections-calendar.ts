// src/app/features/inspections/components/inspections-calendar/inspections-calendar.ts - FIXED IMPORTS
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { map } from 'rxjs/operators';

import { InspectionsService, CalendarEventData } from '../../services/inspections.service';
import { AuthService } from '../../../../core/services/auth.services'; 
import { InspectionDetailsDialogComponent } from './inspection-details-dialog.component';
import { 
  CalendarInspection, 
  EtatInspection, 
  RoleUtilisateur 
} from '../../../../models/inspection.interface';

@Component({
  selector: 'app-inspections-calendar',
  standalone: true,
  imports: [
    CommonModule, 
    FullCalendarModule, 
    MatCardModule, 
    MatSnackBarModule
  ],
  templateUrl: './inspections-calendar.html',
  styleUrls: ['./inspections-calendar.scss']
})
export class InspectionsCalendarComponent implements OnInit {

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,dayGridYear,listWeek'
    },
    weekends: true,
    editable: false,
    selectable: false,
    height: 'auto',
    locale: 'fr',
    buttonText: {
      today: 'Aujourd\'hui',
      month: 'Mois',
      week: 'Semaine',
      day: 'Jour',
      list: 'Liste'
    },
    // Event handling
    eventClick: this.handleEventClick.bind(this),
    eventMouseEnter: this.handleEventMouseEnter.bind(this),
    eventMouseLeave: this.handleEventMouseLeave.bind(this),
    // Dynamic event loading
    events: (fetchInfo, successCallback, failureCallback) => {
      this.loadCalendarEvents(fetchInfo.startStr, fetchInfo.endStr, successCallback, failureCallback);
    }
  };

  constructor(
    private inspectionsService: InspectionsService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Component initialization
    this.checkUserPermissions();
  }

  private loadCalendarEvents(
    startStr: string, 
    endStr: string, 
    successCallback: (events: EventInput[]) => void,
    failureCallback: (error: any) => void
  ): void {
    this.inspectionsService.getInspectionsForCalendar(startStr, endStr)
      .pipe(
        map(inspections => this.convertToCalendarEvents(inspections))
      )
      .subscribe({
        next: events => successCallback(events),
        error: err => {
          console.error('Error loading calendar events:', err);
          this.snackBar.open(
            'Erreur lors du chargement des inspections', 
            'Fermer', 
            { duration: 3000 }
          );
          failureCallback(err);
        }
      });
  }

  private convertToCalendarEvents(inspections: CalendarInspection[]): EventInput[] {
    return inspections.map((inspection): EventInput => ({
      id: inspection.id,
      title: inspection.title,
      start: inspection.start,
      end: inspection.end,
      backgroundColor: this.getColorForStatus(inspection.status),
      borderColor: this.getColorForStatus(inspection.status),
      textColor: '#ffffff',
      extendedProps: {
        inspectionData: inspection,
        originalStatus: this.mapStatusToEtat(inspection.status)
      }
    }));
  }

  // Handle event clicks - Open appropriate dialog based on user role and inspection state
  private handleEventClick(clickInfo: EventClickArg): void {
    const inspectionId = parseInt(clickInfo.event.id);
    const inspectionData = clickInfo.event.extendedProps['inspectionData'];
    
    console.log('Inspection clicked:', { id: inspectionId, data: inspectionData });
    
    // Open the enhanced inspection details dialog
    this.openInspectionDetailsDialog(inspectionId);
  }

  private openInspectionDetailsDialog(inspectionId: number): void {
    const dialogRef = this.dialog.open(InspectionDetailsDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { inspectionId },
      disableClose: false,
      autoFocus: false,
      panelClass: 'inspection-details-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.action === 'navigate' && result.route) {
          // Navigate to full details page
          this.router.navigateByUrl(result.route);
        } else if (result.success) {
          // Inspection was updated, refresh calendar
          this.refreshCalendar();
          
          // Show success message based on action
          let message = 'Inspection mise à jour avec succès';
          if (result.action === 'valider') {
            message = 'Inspection validée avec succès';
          } else if (result.action === 'rejeter') {
            message = 'Inspection rejetée';
          }
          
          this.snackBar.open(message, 'Fermer', {
            duration: 5000,
            panelClass: ['snackbar-success']
          });
        }
      }
    });
  }

  // Visual feedback for hovering
  private handleEventMouseEnter(mouseEnterInfo: any): void {
    mouseEnterInfo.el.style.cursor = 'pointer';
    mouseEnterInfo.el.style.transform = 'translateY(-1px)';
    mouseEnterInfo.el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  }

  private handleEventMouseLeave(mouseLeaveInfo: any): void {
    mouseLeaveInfo.el.style.cursor = 'default';
    mouseLeaveInfo.el.style.transform = 'translateY(0)';
    mouseLeaveInfo.el.style.boxShadow = 'none';
  }

private getColorForStatus(status: string): string {
  switch (status) {
    case 'Planifiée':
      return '#2196F3';    // Bleu - Inspection planifiée
    case 'En cours':
      return '#FF9800';    // Orange - Inspection en cours  
    case 'Terminée':
      return '#4CAF50';    // Vert - Inspection terminée
    case 'Annulée':
      return '#F44336';    // Rouge - Inspection annulée
    case 'Autre':
      return '#9C27B0';    // Violet - Statut "Autre"
    case 'Validée':
      return '#8BC34A';    // Vert clair - Inspection validée
    default: 
      return '#9E9E9E';    // Gris - État inconnu
  }
}

  // Map frontend status labels to backend enum values
  private mapStatusToEtat(status: string): EtatInspection {
    switch (status) {
      case 'Planifiée': return EtatInspection.PROGRAMMEE;
      case 'En cours': return EtatInspection.EN_COURS;
      case 'Clôturée': return EtatInspection.CLOTUREE;
      case 'Validée': return EtatInspection.VALIDEE;
      case 'Rejetée': return EtatInspection.REJETEE;
      default: return EtatInspection.PROGRAMMEE;
    }
  }

  // Utility methods
  getCurrentUserRole(): string {
    const user = this.authService.getCurrentUser();
    if (!user) return 'Non connecté';

    switch (user.role) {
      case RoleUtilisateur.ADMIN: return 'Administrateur';
      case RoleUtilisateur.MAITRE_OUVRAGE: return 'Maître d\'ouvrage';
      case RoleUtilisateur.OPERATEUR: return 'Opérateur';
      default: return user.role;
    }
  }

  private checkUserPermissions(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.snackBar.open(
        'Vous devez être connecté pour accéder au calendrier', 
        'Se connecter',
        { duration: 5000 }
      ).onAction().subscribe(() => {
        this.router.navigate(['/login']);
      });
      return;
    }

    // Log user permissions for debugging
    console.log('User permissions:', {
      role: user.role,
      canClose: this.inspectionsService.canUserCloseInspection(),
      canValidate: this.inspectionsService.canUserValidateInspection()
    });
  }

  private refreshCalendar(): void {
    // Force calendar to refetch events
    const calendarApi = (document.querySelector('full-calendar') as any)?.getApi?.();
    if (calendarApi) {
      calendarApi.refetchEvents();
    }
  }

  // Navigation helpers
  navigateToInspectionsList(): void {
    this.router.navigate(['/inspections']);
  }

  navigateToCreateInspection(): void {
    this.router.navigate(['/inspections/create']);
  }
}