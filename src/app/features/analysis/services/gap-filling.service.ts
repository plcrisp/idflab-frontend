import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GapFillingPreMetricsResponse } from '../pages/gap-filling/models/gap-filling-pre-metrics.model';
import {
  GapFillingExecuteRequest,
  GapFillingFilterConfirmResponse,
  GapFillingFilterParams,
  GapFillingFilterPreviewResponse,
  GapFillingJobResponse,
  GapFillingVisualizationResponse,
} from '../pages/gap-filling/models/gap-filling.model';

@Injectable({
  providedIn: 'root',
})
export class GapFillingService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/gap-filling`;

  private readonly metricsCache = new Map<string, GapFillingPreMetricsResponse>();

  getPreMetrics(
    projectId: string,
    neighborStationId: string,
    forceRefresh = false,
  ): Observable<GapFillingPreMetricsResponse> {
    const cacheKey = `${projectId}_${neighborStationId}`;

    if (!forceRefresh && this.metricsCache.has(cacheKey)) {
      return of(this.metricsCache.get(cacheKey)!);
    }

    const params = new HttpParams().set('neighbor_station_id', neighborStationId);
    const url = `${this.baseUrl}/${projectId}/pre-metrics`;

    return this.http.get<GapFillingPreMetricsResponse>(url, { params }).pipe(
      tap((response) => {
        this.metricsCache.set(cacheKey, response);
      }),
    );
  }

  fillGaps(projectId: string, neighborStationId: string): Observable<GapFillingJobResponse> {
    const payload: GapFillingExecuteRequest = {
      neighbor_station_id: neighborStationId,
      method: 'random_forest',
    };
    return this.http.post<GapFillingJobResponse>(`${this.baseUrl}/${projectId}/fill`, payload);
  }

  getVisualization(
    projectId: string,
    params?: { start?: string; end?: string; year?: number },
  ): Observable<GapFillingVisualizationResponse> {
    let httpParams = new HttpParams();
    if (params?.year) httpParams = httpParams.set('year', params.year);
    if (params?.start) httpParams = httpParams.set('start', params.start);
    if (params?.end) httpParams = httpParams.set('end', params.end);

    return this.http.get<GapFillingVisualizationResponse>(
      `${this.baseUrl}/${projectId}/visualization`,
      { params: httpParams },
    );
  }

  filterPreview(
    projectId: string,
    params: GapFillingFilterParams,
  ): Observable<GapFillingFilterPreviewResponse> {
    return this.http.post<GapFillingFilterPreviewResponse>(
      `${this.baseUrl}/${projectId}/filter/preview`,
      params,
    );
  }

  confirmFilter(
    projectId: string,
    params: GapFillingFilterParams,
  ): Observable<GapFillingFilterConfirmResponse> {
    return this.http.post<GapFillingFilterConfirmResponse>(
      `${this.baseUrl}/${projectId}/filter`,
      params,
    );
  }

  setCachedPreMetrics(
    projectId: string,
    neighborStationId: string,
    response: GapFillingPreMetricsResponse,
  ): void {
    const cacheKey = `${projectId}_${neighborStationId}`;
    this.metricsCache.set(cacheKey, response);
  }

  clearCache(): void {
    this.metricsCache.clear();
  }

  invalidateStationCache(projectId: string, neighborStationId: string): void {
    this.metricsCache.delete(`${projectId}_${neighborStationId}`);
  }
}
