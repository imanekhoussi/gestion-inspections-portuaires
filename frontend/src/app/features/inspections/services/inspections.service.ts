import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Inspection } from '../../../core/models/inspection.interface';

@Injectable({
  providedIn: 'root'
})
export class InspectionsService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getInspections(): Observable<Inspection[]> {
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
}
