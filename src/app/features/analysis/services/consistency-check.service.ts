import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ConsistencyCheckResponse } from '../pages/consistency-check/models/consistency-check.model';

@Injectable({
  providedIn: 'root',
})
export class ConsistencyCheckService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/consistency-check`;

  getConsistencyCheck(
    projectId: string,
    neighborStationId: string,
  ): Observable<ConsistencyCheckResponse> {
    const params = new HttpParams().set('neighbor_station_id', neighborStationId);

    return this.http.get<ConsistencyCheckResponse>(`${this.baseUrl}/${projectId}`, {
      params,
    });
  }
}
