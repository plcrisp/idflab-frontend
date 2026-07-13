import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Project,
  ProjectCreateRequest,
  ProjectCreateResponse,
  SidebarProject,
  SidebarState,
} from '../../models/api/project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/projects`;

  private state = signal<SidebarState>({ loading: true, projects: [] });
  readonly state$ = this.state.asReadonly();

  getProjectById(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/${id}`);
  }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.baseUrl}/`);
  }

  refetch(): void {
    this.state.update((s) => ({ ...s, loading: true }));

    this.getSidebarProjects()
      .pipe(
        catchError((err) => {
          console.error('Erro ao buscar projetos da sidebar', err);
          return of<SidebarProject[]>([]);
        }),
      )
      .subscribe((projects) => {
        this.state.set({ loading: false, projects });
      });
  }

  getSidebarProjects(): Observable<SidebarProject[]> {
    return this.http.get<SidebarProject[]>(`${this.baseUrl}/sidebar`);
  }

  createProject(payload: ProjectCreateRequest): Observable<ProjectCreateResponse> {
    return this.http.post<ProjectCreateResponse>(`${this.baseUrl}/`, payload);
  }
}
