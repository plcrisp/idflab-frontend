import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Project,
  ProjectCreateRequest,
  ProjectCreateResponse,
  ProjectResponse,
  SidebarProject,
  SidebarState,
  StepEnum,
} from '../../models/api/project.model';
import {
  getRouteForStep,
  getStepForRoute,
  isStepBeyond,
  STEP_ORDER,
  STEP_ROUTE_MAP,
} from '../../utils/project-step.utils';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/projects`;

  private state = signal<SidebarState>({ loading: true, projects: [] });
  readonly state$ = this.state.asReadonly();

  private currentProject = signal<ProjectResponse | null>(null);
  readonly currentProject$ = this.currentProject.asReadonly();

  setCurrentProject(project: ProjectResponse | null): void {
    this.currentProject.set(project);
  }

  getCurrentProject(): ProjectResponse | null {
    return this.currentProject();
  }

  getProjectById(id: string, force = false): Observable<ProjectResponse> {
    const cached = this.currentProject();
    if (!force && cached && cached.id === id) {
      return of(cached);
    }
    return this.http
      .get<ProjectResponse>(`${this.baseUrl}/${id}`)
      .pipe(tap((project) => this.currentProject.set(project)));
  }

  updateFurthestStep(projectId: string, furthestStep: StepEnum): Observable<ProjectResponse> {
    return this.http
      .patch<ProjectResponse>(`${this.baseUrl}/${projectId}/furthest-step`, {
        furthest_step: furthestStep,
      })
      .pipe(tap((project) => this.currentProject.set(project)));
  }

  getRouteForStep(step: StepEnum): string {
    return getRouteForStep(step);
  }

  getStepForRoute(routeSegment: string): StepEnum | null {
    return getStepForRoute(routeSegment);
  }

  isStepBeyond(targetStep: StepEnum, furthestStep: StepEnum): boolean {
    return isStepBeyond(targetStep, furthestStep);
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
