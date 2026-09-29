import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StepEnum } from '../../models/api/project.model';
import {
  ProjectStepResponse,
  ProjectStepSaveRequest,
} from '../../models/api/project-step.model';

@Injectable({ providedIn: 'root' })
export class ProjectStepsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/project-steps`;

  // Busca uma etapa específica do projeto
  getProjectStep<T = any>(projectId: string, step: StepEnum): Observable<ProjectStepResponse<T>> {
    return this.http.get<ProjectStepResponse<T>>(`${this.apiUrl}/project/${projectId}/step/${step}`);
  }

  // Salva ou atualiza a etapa do projeto (upsert)
  saveProjectStep<T = any>(
    projectId: string,
    request: ProjectStepSaveRequest<T>,
  ): Observable<ProjectStepResponse<T>> {
    return this.http.post<ProjectStepResponse<T>>(`${this.apiUrl}/project/${projectId}`, request);
  }
}
