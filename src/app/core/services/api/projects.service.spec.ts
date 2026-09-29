import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjectsService } from './projects.service';
import { ProjectResponse } from '../../models/api/project.model';
import { environment } from '../../../../environments/environment';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let httpTesting: HttpTestingController;

  const mockProject: ProjectResponse = {
    id: 'proj-123',
    user_id: 'user-1',
    name: 'Estação Teste',
    start_date: '2020-01-01',
    end_date: '2023-01-01',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    furthest_step: 'INITIAL_VISUALIZATION',
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
    TestBed.configureTestingModule({
      providers: [
        ProjectsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ProjectsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should fetch project by ID and cache it', () => {
    let result: ProjectResponse | undefined;

    service.getProjectById('proj-123').subscribe((p) => {
      result = p;
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/projects/proj-123`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProject);

    expect(result).toEqual(mockProject);
    expect(service.getCurrentProject()).toEqual(mockProject);
  });

  it('should update furthest step via PATCH and update cached project', () => {
    service.setCurrentProject(mockProject);

    const updatedProject: ProjectResponse = {
      ...mockProject,
      furthest_step: 'CONSISTENCY',
    };

    let result: ProjectResponse | undefined;
    service.updateFurthestStep('proj-123', 'CONSISTENCY').subscribe((p) => {
      result = p;
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/projects/proj-123/furthest-step`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ furthest_step: 'CONSISTENCY' });

    req.flush(updatedProject);

    expect(result?.furthest_step).toBe('CONSISTENCY');
    expect(service.getCurrentProject()?.furthest_step).toBe('CONSISTENCY');
  });

  it('should return cached project on subsequent call without making HTTP request', () => {
    service.setCurrentProject(mockProject);

    let result: ProjectResponse | undefined;
    service.getProjectById('proj-123').subscribe((p) => {
      result = p;
    });

    httpTesting.expectNone(`${environment.apiUrl}/projects/proj-123`);
    expect(result).toEqual(mockProject);
  });
});
