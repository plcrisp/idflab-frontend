import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GapFillingPreMetricsResponse } from '../pages/gap-filling/models/gap-filling-pre-metrics.model';

@Injectable({
  providedIn: 'root',
})
export class GapFillingService {
  private http = inject(HttpClient);
  private readonly projectsBaseUrl = `${environment.apiUrl}/projects`;

  // Cache em memória indexado por "${projectId}_${neighborStationId}" durante a sessão da etapa
  private readonly metricsCache = new Map<string, GapFillingPreMetricsResponse>();

  /**
   * Obtém as métricas pré-preenchimento para a estação vizinha informada.
   * Contrato: GET /api/v1/projects/{project_id}/gap-filling/pre-metrics?neighbor_station_id={uuid}
   *
   * @param projectId ID do projeto atual
   * @param neighborStationId ID da estação vizinha
   * @param forceRefresh Se verdadeiro, ignora o cache e faz nova requisição
   */
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
    const url = `${this.projectsBaseUrl}/${projectId}/gap-filling/pre-metrics`;

    return this.http.get<GapFillingPreMetricsResponse>(url, { params }).pipe(
      tap((response) => {
        this.metricsCache.set(cacheKey, response);
      }),
    );
  }

  /**
   * Limpa o cache de métricas em memória.
   */
  clearCache(): void {
    this.metricsCache.clear();
  }

  /**
   * Remove uma estação específica do cache.
   */
  invalidateStationCache(projectId: string, neighborStationId: string): void {
    this.metricsCache.delete(`${projectId}_${neighborStationId}`);
  }
}
