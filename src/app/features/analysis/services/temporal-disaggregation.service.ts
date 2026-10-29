import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  BartlettLewisExecuteRequest,
  CetesbExecutionResponse,
  CetesbFactorItem,
  TemporalDisaggregationJobResponse,
  TemporalDisaggregationDecayCurveResponse,
  TemporalDisaggregationTableResponse,
} from '../pages/temporal-disaggregation/models/temporal-disaggregation.model';

@Injectable({
  providedIn: 'root',
})
export class TemporalDisaggregationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/temporal-disaggregation`;

  getCetesbFactors(): Observable<CetesbFactorItem[]> {
    return this.http.get<CetesbFactorItem[]>(`${this.baseUrl}/cetesb-factors`);
  }

  executeBartlettLewis(
    projectId: string,
    payload: BartlettLewisExecuteRequest,
  ): Observable<TemporalDisaggregationJobResponse> {
    return this.http.post<TemporalDisaggregationJobResponse>(
      `${this.baseUrl}/${projectId}/bartlett-lewis`,
      payload,
    );
  }

  executeCetesb(projectId: string): Observable<CetesbExecutionResponse> {
    return this.http.post<CetesbExecutionResponse>(`${this.baseUrl}/${projectId}/cetesb`, {});
  }

  executeDirectAggregation(projectId: string): Observable<CetesbExecutionResponse> {
    return this.http.post<CetesbExecutionResponse>(
      `${this.baseUrl}/${projectId}/direct-aggregation`,
      {},
    );
  }

  getResultTable(
    projectId: string,
    page: number = 1,
    pageSize: number = 10,
    order: 'asc' | 'desc' = 'asc',
    unit: 'mm' | 'mm_h' = 'mm',
  ): Observable<TemporalDisaggregationTableResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString())
      .set('order', order);

    if (unit) {
      params = params.set('unit', unit);
    }

    return this.http.get<TemporalDisaggregationTableResponse>(
      `${this.baseUrl}/${projectId}/result/table`,
      { params },
    );
  }

  getResultDecayCurve(projectId: string): Observable<TemporalDisaggregationDecayCurveResponse> {
    return this.http.get<TemporalDisaggregationDecayCurveResponse>(
      `${this.baseUrl}/${projectId}/result/decay-curve`,
    );
  }

  downloadTableCsv(
    projectId: string,
    delimiter: ';' | ',' = ';',
    unit: 'mm' | 'mm_h' = 'mm',
  ): Observable<HttpResponse<Blob>> {
    let params = new HttpParams().set('delimiter', delimiter);

    if (unit) {
      params = params.set('unit', unit);
    }

    return this.http.get<Blob>(
      `${this.baseUrl}/${projectId}/result/table/download`,
      {
        params,
        responseType: 'blob' as 'json',
        observe: 'response',
      },
    );
  }
}

