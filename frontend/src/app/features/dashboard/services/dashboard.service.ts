import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardKpis } from '../../../core/models/dashboard.interface';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getKpis(): Observable<DashboardKpis> {
    return this.http.get<DashboardKpis>(`${this.API_URL}/dashboard/kpis`);
  }
}