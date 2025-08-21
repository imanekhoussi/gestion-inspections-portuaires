import { Component } from '@angular/core';
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
import { map } from 'rxjs/operators';
import { InspectionsService, CalendarEventData } from '../../services/inspections.service';
import { InspectionDetailsDialogComponent } from './inspection-details-dialog.component';

@Component({
  selector: 'app-inspections-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, MatCardModule],
  templateUrl: './inspections-calendar.html',
  styleUrls: ['./inspections-calendar.scss']
})
export class InspectionsCalendarComponent {

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
    selectable: true,
    // Add click handler for events
    eventClick: this.handleEventClick.bind(this),
    // Make events appear clickable
    eventMouseEnter: this.handleEventMouseEnter.bind(this),
    eventMouseLeave: this.handleEventMouseLeave.bind(this),
    events: (fetchInfo, successCallback, failureCallback) => {
      this.inspectionsService.getInspectionsForCalendar(fetchInfo.startStr, fetchInfo.endStr)
        .pipe(
          map(inspections => inspections.map((inspection): EventInput => ({
            title: inspection.title,
            start: inspection.start,
            end: inspection.end,
            id: inspection.id,
            backgroundColor: this.getColorForStatus(inspection.status),
            borderColor: this.getColorForStatus(inspection.status),
            textColor: '#ffffff',
            // Add custom properties for the inspection details
            extendedProps: {
              inspectionData: inspection
            }
          })))
        )
        .subscribe({
          next: events => successCallback(events),
          error: err => {
            console.error('Error fetching or processing calendar events', err);
            failureCallback(err);
          }
        });
    }
  };

  constructor(
    private inspectionsService: InspectionsService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  // Handle event clicks
  private handleEventClick(clickInfo: EventClickArg): void {
    const inspectionId = clickInfo.event.id;
    const inspectionData = clickInfo.event.extendedProps['inspectionData'];
    
    console.log('Inspection clicked:', inspectionData);
    
    // Option 1: Navigate to a detailed view page
    // this.router.navigate(['/inspections/details', inspectionId]);
    
    // Option 2: Open a dialog with inspection details
    this.openInspectionDialog(inspectionData);
    
    // Option 3: Navigate to the inspections list and highlight the specific inspection
    // this.router.navigate(['/inspections'], { 
    //   queryParams: { highlight: inspectionId } 
    // });
  }

  // Handle mouse enter for visual feedback
  private handleEventMouseEnter(mouseEnterInfo: any): void {
    mouseEnterInfo.el.style.cursor = 'pointer';
    mouseEnterInfo.el.style.opacity = '0.8';
  }

  // Handle mouse leave
  private handleEventMouseLeave(mouseLeaveInfo: any): void {
    mouseLeaveInfo.el.style.cursor = 'default';
    mouseLeaveInfo.el.style.opacity = '1';
  }

  // Open inspection details in a dialog
  private openInspectionDialog(inspectionData: CalendarEventData): void {
    const dialogRef = this.dialog.open(InspectionDetailsDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: inspectionData,
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        switch (result.action) {
          case 'view':
            // Navigate to full inspection details
            this.router.navigate(['/inspections/details', result.inspectionId]);
            break;
          case 'edit':
            // Navigate to edit inspection
            this.router.navigate(['/inspections/edit', result.inspectionId]);
            break;
        }
      }
    });
  }

  private getColorForStatus(status: string): string {
    switch (status) {
      case 'Planifiée': return '#1976D2'; // Blue
      case 'Terminée': return '#388E3C';  // Green
      case 'Annulée': return '#FBC02D';   // Yellow/Orange
      case 'Rejetée': return '#D32F2F';   // Red
      default: return '#757575';          // Grey
    }
  }
}