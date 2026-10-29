import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  DistributionEnum,
  DistributionSelectionRequest,
  DistributionSelectionResponse,
  DistributionStateResponse,
  DurationDetailResponse,
  SelectionOrigin,
} from '../pages/distribution/models/statistical-distribution.model';

@Injectable({
  providedIn: 'root',
})
export class StatisticalDistributionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/statistical-distribution`;

  getState(projectId: string): Observable<DistributionStateResponse> {
    return this.http.get<DistributionStateResponse>(`${this.baseUrl}/${projectId}/state`);
  }

  fit(projectId: string): Observable<DistributionStateResponse> {
    return this.http.post<DistributionStateResponse>(`${this.baseUrl}/${projectId}/fit`, {});
  }

  getDurationDetail(
    projectId: string,
    durationMinutes: number,
  ): Observable<DurationDetailResponse> {
    return this.http.get<DurationDetailResponse>(
      `${this.baseUrl}/${projectId}/durations/${durationMinutes}`,
    );
  }

  saveSelection(
    projectId: string,
    selectedDistribution: DistributionEnum,
    selectionOrigin: SelectionOrigin = 'manual',
  ): Observable<DistributionSelectionResponse> {
    const payload: DistributionSelectionRequest = {
      selected_distribution: selectedDistribution,
      selection_origin: selectionOrigin,
    };
    return this.http.put<DistributionSelectionResponse>(
      `${this.baseUrl}/${projectId}/selection`,
      payload,
    );
  }
}

