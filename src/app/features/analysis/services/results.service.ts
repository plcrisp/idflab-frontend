import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ResultsResponse } from '../pages/results/models/results.model';

@Injectable({ providedIn: 'root' })
export class ResultsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/results`;

  getResults(projectId: string): Observable<ResultsResponse> {
    return this.http.get<ResultsResponse>(`${this.baseUrl}/${projectId}`);
  }

  downloadCsv(
    projectId: string,
    delimiter: ';' | ',' = ';',
  ): Observable<HttpResponse<Blob>> {
    const params = new HttpParams().set('delimiter', delimiter);

    return this.http.get<Blob>(`${this.baseUrl}/${projectId}/csv`, {
      params,
      responseType: 'blob' as 'json',
      observe: 'response',
    });
  }
}

