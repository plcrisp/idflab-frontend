import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HistoricalIdfResponse } from '../pages/historical-idf/models/historical-idf.model';

@Injectable({ providedIn: 'root' })
export class HistoricalIdfService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/historical-idf`;

  getHistoricalIdf(projectId: string): Observable<HistoricalIdfResponse> {
    return this.http.get<HistoricalIdfResponse>(`${this.baseUrl}/${projectId}`);
  }

  downloadHistoricalIdf(
    projectId: string,
    delimiter: ';' | ',' = ';',
  ): Observable<HttpResponse<Blob>> {
    const params = new HttpParams().set('delimiter', delimiter);
    return this.http.get<Blob>(`${this.baseUrl}/${projectId}/download`, {
      params,
      responseType: 'blob' as 'json',
      observe: 'response',
    });
  }
}


