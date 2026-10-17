import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CetesbExecutionResponse, CetesbFactorItem } from '../pages/temporal-disaggregation/models/temporal-disaggregation.model';

@Injectable({
  providedIn: 'root',
})
export class TemporalDisaggregationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/temporal-disaggregation`;

  getCetesbFactors(): Observable<CetesbFactorItem[]> {
    return this.http.get<CetesbFactorItem[]>(`${this.baseUrl}/cetesb-factors`);
  }

  executeCetesb(projectId: string): Observable<CetesbExecutionResponse> {
    return this.http.post<CetesbExecutionResponse>(`${this.baseUrl}/${projectId}/cetesb`, {});
  }
}
