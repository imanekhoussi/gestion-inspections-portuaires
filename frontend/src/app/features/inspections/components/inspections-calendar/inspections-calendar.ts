import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// --- FullCalendar Imports ---
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

// --- Project Imports ---
import { InspectionsService } from '../../services/inspections.service';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-inspections-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule,
    MatCardModule,
  ],
  // ✅ FIX: Corrected file paths to match your uploaded files
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
    events: this.fetchEvents.bind(this),
  };

  constructor(private inspectionsService: InspectionsService) {}

  fetchEvents(fetchInfo: any, successCallback: (events: EventInput[]) => void, failureCallback: (error: any) => void): void {
    const start = fetchInfo.startStr;
    const end = fetchInfo.endStr;

    this.inspectionsService.getInspectionsForCalendar(start, end).subscribe({
      next: (events) => {
        successCallback(events);
      },
      error: (err) => {
        console.error('Error fetching calendar events', err);
        failureCallback(err);
      }
    });
  }
}