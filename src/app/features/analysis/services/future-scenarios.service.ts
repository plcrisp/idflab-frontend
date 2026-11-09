import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  FutureScenariosApplyRequest,
  FutureScenariosJobResponse,
  FutureScenariosStateQuery,
  FutureScenariosStateResponse,
} from '../pages/future-scenarios/models/future-scenarios.model';

@Injectable({ providedIn: 'root' })
export class FutureScenariosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/future-scenarios`;

  getState(
    projectId: string,
    query?: FutureScenariosStateQuery,
  ): Observable<FutureScenariosStateResponse> {
    let params = new HttpParams();

    if (query) {
      if (query.method) params = params.set('method', query.method);
      if (query.model) params = params.set('model', query.model);
      if (query.ssp) params = params.set('ssp', query.ssp);
      if (query.period) params = params.set('period', query.period);
      if (query.start_year != null) {
        params = params.set('start_year', query.start_year.toString());
      }
      if (query.end_year != null) {
        params = params.set('end_year', query.end_year.toString());
      }
    }

    return this.http.get<FutureScenariosStateResponse>(
      `${this.baseUrl}/${projectId}/state`,
      { params },
    );
  }

  apply(
    projectId: string,
    payload: FutureScenariosApplyRequest,
  ): Observable<FutureScenariosJobResponse> {
    return this.http.post<FutureScenariosJobResponse>(
      `${this.baseUrl}/${projectId}/apply`,
      payload,
    );
  }
}

