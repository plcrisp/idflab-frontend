import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  getSummary(projectId: string): Observable<SummaryResponse> {
    const params = new HttpParams().set('project_id', projectId);

    return this.http
      .get<SummaryResponse>(`${this.baseUrl}/summary`, { params })
      .pipe(tap((response) => console.log('Summary Response:', response)));
  }

  getDetail(projectId: string, start: string, end: string): Observable<DetailResponse> {
    const params = new HttpParams()
      .set('project_id', projectId)
      .set('start', start)
      .set('end', end);

    return this.http
      .get<DetailResponse>(`${this.baseUrl}/detail`, { params })
      .pipe(tap((response) => console.log('Detail Response:', response)));
  }
}
