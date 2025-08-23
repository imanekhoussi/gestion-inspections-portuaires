import { Injectable } from '@angular/core';
import { HttpClient, HttpParams  } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Inspection } from '../../../core/models/inspection.interface';
import { map } from 'rxjs/operators';

export interface CalendarEventData {
  title: string;
  start: string;
  end: string;
  status: 'Planifiée' | 'Terminée' | 'Annulée' | 'Rejetée';
  id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InspectionsService {
  // ✅ FIX: Changed '/admin' to '/inspections' to match your backend controller's route.
  private readonly API_URL = `${environment.apiUrl}/admin/inspections`;

  constructor(private http: HttpClient) {}

  getInspections(): Observable<Inspection[]> {
    return this.http.get<Inspection[]>(`${this.API_URL}`);
  }

  getInspection(id: string): Observable<Inspection> {
    return this.http.get<Inspection>(`${this.API_URL}/${id}`);
  }

  createInspection(inspection: Partial<Inspection>): Observable<Inspection> {
    return this.http.post<Inspection>(`${this.API_URL}`, inspection);
  }

  updateInspection(id: string, inspection: Partial<Inspection>): Observable<Inspection> {
    return this.http.put<Inspection>(`${this.API_URL}/${id}`, inspection);
  }

  deleteInspection(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
getInspectionsForCalendar(start: string, end: string): Observable<CalendarEventData[]> {
  const params = new HttpParams()
    .set('startDate', start)
    .set('endDate', end);
    
  return this.http.get<{success: boolean, data: CalendarEventData[]}>(`${this.API_URL}/calendar`, { params })
    .pipe(
      map(response => response.data) // Extract the data array from the wrapped response
    );
}
}