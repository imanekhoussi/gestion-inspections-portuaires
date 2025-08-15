import { Injectable } from '@angular/core';
import { HttpClient, HttpParams  } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Inspection } from '../../../core/models/inspection.interface';
import { EventInput } from '@fullcalendar/core';
@Injectable({
  providedIn: 'root'
})
export class InspectionsService {
  // ✅ FIX: Added '/admin' to the base API path
  private readonly API_URL = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getInspections(): Observable<Inspection[]> {
    // This will now correctly call /admin/inspections
    return this.http.get<Inspection[]>(`${this.API_URL}/inspections`);
  }

  getInspection(id: string): Observable<Inspection> {
    return this.http.get<Inspection>(`${this.API_URL}/inspections/${id}`);
  }

  createInspection(inspection: Partial<Inspection>): Observable<Inspection> {
    return this.http.post<Inspection>(`${this.API_URL}/inspections`, inspection);
  }

  updateInspection(id: string, inspection: Partial<Inspection>): Observable<Inspection> {
    return this.http.put<Inspection>(`${this.API_URL}/inspections/${id}`, inspection);
  }

  deleteInspection(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/inspections/${id}`);
  }
  getInspectionsForCalendar(start: string, end: string): Observable<EventInput[]> {
    const params = new HttpParams()
      .set('startDate', start)
      .set('endDate', end);
    return this.http.get<EventInput[]>(`${this.API_URL}/calendar`, { params });
  }
}
