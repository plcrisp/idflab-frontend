import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}

