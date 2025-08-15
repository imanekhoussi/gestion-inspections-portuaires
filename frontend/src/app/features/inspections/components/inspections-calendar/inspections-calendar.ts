import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { MatCardModule } from '@angular/material/card';
import { map } from 'rxjs/operators';
import { InspectionsService, CalendarEventData } from '../../services/inspections.service';

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
      right: 'dayGridMonth,timeGridWeek,listWeek'
    },
    weekends: true,
    editable: false,
    selectable: true,
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
            textColor: '#ffffff'
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

  constructor(private inspectionsService: InspectionsService) {}

  private getColorForStatus(status: string): string {
    switch (status) {
      case 'Planifiée': return '#1976D2'; // Blue
      case 'Terminée': return '#388E3C';  // Green
      case 'Annulée': return '#FBC02D';  // Yellow/Orange
      case 'Rejetée': return '#D32F2F';  // Red
      default: return '#757575';         // Grey
    }
  }
}