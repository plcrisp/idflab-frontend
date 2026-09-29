import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { projectAccessGuard } from './project-access.guard';
import { ProjectsService } from '../services/api/projects.service';
import { ProjectResponse } from '../models/api/project.model';

describe('projectAccessGuard', () => {
  let projectsServiceMock: {
    getProjectById: ReturnType<typeof vi.fn>;
    setCurrentProject: ReturnType<typeof vi.fn>;
    getCurrentProject: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  const mockProject: ProjectResponse = {
    id: 'proj-123',
    user_id: 'user-1',
    name: 'Projeto Teste',
    start_date: '2020-01-01',
    end_date: '2023-01-01',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    furthest_step: 'CONSISTENCY',
    station: {
      id: 'st-1',
      name: 'Estação Central',
      code: 'EST001',
      city: 'São Paulo',
      state: 'SP',
      latitude: -23.55,
      longitude: -46.63,
      source: 'INMET',
      resolution: '1D',
      station_type: 'Convencional',
    },
  };

  beforeEach(() => {
    projectsServiceMock = {
      getProjectById: vi.fn(),
      setCurrentProject: vi.fn(),
      getCurrentProject: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ProjectsService, useValue: projectsServiceMock },
      ],
    });

    router = TestBed.inject(Router);
  });

  function createRouteSnapshot(
    params: Record<string, string>,
    url = '',
    parent?: ActivatedRouteSnapshot,
  ): ActivatedRouteSnapshot {
    return {
      paramMap: {
        get: (key: string) => params[key] ?? null,
      },
      queryParams: {},
      fragment: null,
      parent: parent ?? null,
    } as unknown as ActivatedRouteSnapshot;
  }

  function createStateSnapshot(url: string): RouterStateSnapshot {
    return { url } as RouterStateSnapshot;
  }

  it('should redirect to /app/dashboard if projectId is not found in route parameters', () => {
    const route = createRouteSnapshot({});
    const state = createStateSnapshot('/app/analysis');

    const result = TestBed.runInInjectionContext(() =>
      projectAccessGuard(route, state),
    );

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/app/dashboard');
    expect(projectsServiceMock.getProjectById).not.toHaveBeenCalled();
  });

  it('should redirect to /app/dashboard if projectService returns an error (404/403)', () => {
    projectsServiceMock.getProjectById.mockReturnValue(
      throwError(() => new Error('404 Not Found')),
    );

    const route = createRouteSnapshot({ projectId: 'proj-999' });
    const state = createStateSnapshot('/app/analysis/proj-999');

    let guardResult: boolean | UrlTree | undefined;
    TestBed.runInInjectionContext(() => {
      const obs = projectAccessGuard(route, state) as any;
      obs.subscribe((res: any) => {
        guardResult = res;
      });
    });

    expect(guardResult instanceof UrlTree).toBe(true);
    expect((guardResult as UrlTree).toString()).toBe('/app/dashboard');
  });

  it('should redirect base route access (/app/analysis/:id) to furthest_step route', () => {
    projectsServiceMock.getProjectById.mockReturnValue(of(mockProject));

    const route = createRouteSnapshot({ projectId: 'proj-123' });
    const state = createStateSnapshot('/app/analysis/proj-123');

    let guardResult: boolean | UrlTree | undefined;
    TestBed.runInInjectionContext(() => {
      const obs = projectAccessGuard(route, state) as any;
      obs.subscribe((res: any) => {
        guardResult = res;
      });
    });

    expect(projectsServiceMock.setCurrentProject).toHaveBeenCalledWith(mockProject);
    expect(guardResult instanceof UrlTree).toBe(true);
    expect((guardResult as UrlTree).toString()).toBe('/app/analysis/proj-123/consistency-check');
  });

  it('should redirect base route to initial-view when furthest_step is INITIAL_VISUALIZATION', () => {
    const projectAtInitial: ProjectResponse = {
      ...mockProject,
      furthest_step: 'INITIAL_VISUALIZATION',
    };
    projectsServiceMock.getProjectById.mockReturnValue(of(projectAtInitial));

    const route = createRouteSnapshot({ projectId: 'proj-123' });
    const state = createStateSnapshot('/app/analysis/proj-123');

    let guardResult: boolean | UrlTree | undefined;
    TestBed.runInInjectionContext(() => {
      const obs = projectAccessGuard(route, state) as any;
      obs.subscribe((res: any) => {
        guardResult = res;
      });
    });

    expect(guardResult instanceof UrlTree).toBe(true);
    expect((guardResult as UrlTree).toString()).toBe('/app/analysis/proj-123/initial-view');
  });

  it('should allow access (return true) when navigating to the furthest_step', () => {
    projectsServiceMock.getProjectById.mockReturnValue(of(mockProject));

    const route = createRouteSnapshot({ projectId: 'proj-123' });
    const state = createStateSnapshot('/app/analysis/proj-123/consistency-check');

    let guardResult: boolean | UrlTree | undefined;
    TestBed.runInInjectionContext(() => {
      const obs = projectAccessGuard(route, state) as any;
      obs.subscribe((res: any) => {
        guardResult = res;
      });
    });

    expect(guardResult).toBe(true);
  });

  it('should allow access (return true) when navigating to an earlier step than furthest_step', () => {
    projectsServiceMock.getProjectById.mockReturnValue(of(mockProject));

    const route = createRouteSnapshot({ projectId: 'proj-123' });
    const state = createStateSnapshot('/app/analysis/proj-123/initial-view');

    let guardResult: boolean | UrlTree | undefined;
    TestBed.runInInjectionContext(() => {
      const obs = projectAccessGuard(route, state) as any;
      obs.subscribe((res: any) => {
        guardResult = res;
      });
    });

    expect(guardResult).toBe(true);
  });

  it('should block and redirect to furthest_step when attempting to skip ahead', () => {
    projectsServiceMock.getProjectById.mockReturnValue(of(mockProject));

    const route = createRouteSnapshot({ projectId: 'proj-123' });
    const state = createStateSnapshot('/app/analysis/proj-123/distribuicao-estatistica');

    let guardResult: boolean | UrlTree | undefined;
    TestBed.runInInjectionContext(() => {
      const obs = projectAccessGuard(route, state) as any;
      obs.subscribe((res: any) => {
        guardResult = res;
      });
    });

    expect(guardResult instanceof UrlTree).toBe(true);
    expect((guardResult as UrlTree).toString()).toBe('/app/analysis/proj-123/consistency-check');
  });

  it('should preserve query parameters on redirection', () => {
    projectsServiceMock.getProjectById.mockReturnValue(of(mockProject));

    const route = createRouteSnapshot({ projectId: 'proj-123' });
    (route as any).queryParams = { station: 'EST001' };
    const state = createStateSnapshot('/app/analysis/proj-123?station=EST001');

    let guardResult: boolean | UrlTree | undefined;
    TestBed.runInInjectionContext(() => {
      const obs = projectAccessGuard(route, state) as any;
      obs.subscribe((res: any) => {
        guardResult = res;
      });
    });

    expect(guardResult instanceof UrlTree).toBe(true);
    expect((guardResult as UrlTree).toString()).toBe(
      '/app/analysis/proj-123/consistency-check?station=EST001',
    );
  });

  it('should support param named id from route or parent', () => {
    projectsServiceMock.getProjectById.mockReturnValue(of(mockProject));

    const parentRoute = createRouteSnapshot({ id: 'proj-123' });
    const childRoute = createRouteSnapshot({}, '', parentRoute);
    const state = createStateSnapshot('/projects/proj-123/consistency-check');

    let guardResult: boolean | UrlTree | undefined;
    TestBed.runInInjectionContext(() => {
      const obs = projectAccessGuard(childRoute, state) as any;
      obs.subscribe((res: any) => {
        guardResult = res;
      });
    });

    expect(projectsServiceMock.getProjectById).toHaveBeenCalledWith('proj-123');
    expect(guardResult).toBe(true);
  });
});
