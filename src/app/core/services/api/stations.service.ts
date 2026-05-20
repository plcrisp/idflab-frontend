import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Marker, Station, StationBBoxRequest } from '../../models/api/station.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/station`;

  getMarkers(request: StationBBoxRequest): Observable<Marker[]> {
    const params = new HttpParams()
      .set('min_lat', request.min_lat)
      .set('max_lat', request.max_lat)
      .set('min_lon', request.min_lon)
      .set('max_lon', request.max_lon);

    const fullParams = request.sources.reduce(
      (acc, source) => acc.append('sources', source),
      params,
    );

    return this.http.get<Marker[]>(`${this.baseUrl}/markers`, { params: fullParams });
  }

  getStationById(id: string): Observable<Marker> {
    return this.http.get<Marker>(`${this.baseUrl}/${id}`);
  }

  searchStations(state: string, search: string): Observable<Station[]> {
    let params = new HttpParams();

    params = params.set('search', search.trim());

    return this.http.get<Station[]>(`${this.baseUrl}/search/${state}`, { params });
  }
}
