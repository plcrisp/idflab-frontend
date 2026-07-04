import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ProjectCreateRequest, ProjectCreateResponse } from '../../models/api/project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/projects`;

  createProject(payload: ProjectCreateRequest): Observable<ProjectCreateResponse> {
    return this.http.post<ProjectCreateResponse>(`${this.baseUrl}/`, payload);
  }
}
