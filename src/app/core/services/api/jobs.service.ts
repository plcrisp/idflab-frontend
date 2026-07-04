import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Job } from '../../models/api/job.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class JobsService {
  private baseUrl = `${environment.apiUrl}/jobs/project`;

  constructor(private http: HttpClient) {}

  getJobsByProject(projectId: string): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.baseUrl}/${projectId}`);
  }
}
