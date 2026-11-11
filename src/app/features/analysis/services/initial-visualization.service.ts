import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  DetailResponse,
  SummaryResponse,
} from '../pages/initial-visualization/models/initial-visualization.model';

@Injectable({ providedIn: 'root' })
export class InitialVisualizationService {
  private baseUrl = `${environment.apiUrl}/initial-visualization`;

  constructor(private http: HttpClient) {}

  getSummary(projectId: string, raw: boolean = false): Observable<SummaryResponse> {
    let params = new HttpParams().set('project_id', projectId);
    if (raw) {
      params = params.set('raw', 'true');
    }

    return this.http.get<SummaryResponse>(`${this.baseUrl}/summary`, { params });
  }

  getDetail(projectId: string, start: string, end: string, raw: boolean = false): Observable<DetailResponse> {
    let params = new HttpParams()
      .set('project_id', projectId)
      .set('start', start)
      .set('end', end);
    if (raw) {
      params = params.set('raw', 'true');
    }

    return this.http
      .get<DetailResponse>(`${this.baseUrl}/detail`, { params })
      .pipe(tap((response) => console.log('Detail Response:', response)));
  }

  downloadRawSeries(
    projectId: string,
    delimiter: ';' | ',' = ';',
  ): Observable<HttpResponse<Blob>> {
    const params = new HttpParams()
      .set('project_id', projectId)
      .set('delimiter', delimiter);

    return this.http.get<Blob>(`${environment.apiUrl}/precipitation-data/download`, {
      params,
      responseType: 'blob' as 'json',
      observe: 'response',
    });
  }
}
