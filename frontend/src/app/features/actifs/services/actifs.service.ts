import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Actif, ActifGeoJSON } from '../../../core/models/actif.interface';

@Injectable({
  providedIn: 'root'
})
export class ActifsService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getActifs(): Observable<Actif[]> {
    return this.http.get<Actif[]>(`${this.API_URL}/actifs`);
  }

  getActifsGeoJSON(): Observable<ActifGeoJSON> {
    return this.http.get<ActifGeoJSON>(`${this.API_URL}/actifs/geojson`);
  }
}