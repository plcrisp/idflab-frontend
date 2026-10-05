import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GapFillingViabilityResponse } from '../pages/consistency-check/models/gap-filling.model';

@Injectable({
  providedIn: 'root',
})
export class GapFillingService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/gap-filling`;

  getGapFillingMetrics(
    projectId: string,
    neighborStationId: string,
  ): Observable<GapFillingViabilityResponse> {
    const params = new HttpParams().set('neighbor_station_id', neighborStationId);

    return this.http.get<GapFillingViabilityResponse>(`${this.baseUrl}/${projectId}`, {
      params,
    });
  }
}
