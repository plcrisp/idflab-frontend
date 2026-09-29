import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProjectStateService } from './project-state.service';
import { ProjectsService } from '../../../core/services/api/projects.service';
import { NotificationsService } from '../../../core/services/api/notifications.service';
import { ProjectResponse } from '../../../core/models/api/project.model';
import { signal } from '@angular/core';

describe('ProjectStateService', () => {
  let service: ProjectStateService;
  let projectsServiceMock: {
    getProjectById: ReturnType<typeof vi.fn>;
    getCurrentProject: ReturnType<typeof vi.fn>;
    updateFurthestStep: ReturnType<typeof vi.fn>;
  };
  let notificationsServiceMock: {
    panel: ReturnType<typeof signal>;
  };

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
    projectsServiceMock = {
      getProjectById: vi.fn(),
      getCurrentProject: vi.fn(),
      updateFurthestStep: vi.fn(),
    };
    notificationsServiceMock = {
      panel: signal(null),
    };

    TestBed.configureTestingModule({
      providers: [
        ProjectStateService,
        { provide: ProjectsService, useValue: projectsServiceMock },
        { provide: NotificationsService, useValue: notificationsServiceMock },
      ],
    });

    service = TestBed.inject(ProjectStateService);
  });

  it('should update furthest step and update current project state', () => {
    service.setProject(mockProject);

    const updatedProject: ProjectResponse = {
      ...mockProject,
      furthest_step: 'CONSISTENCY',
    };
    projectsServiceMock.updateFurthestStep.mockReturnValue(of(updatedProject));

    let result: ProjectResponse | undefined;
    service.updateFurthestStep('CONSISTENCY').subscribe((p) => {
      result = p;
    });

    expect(projectsServiceMock.updateFurthestStep).toHaveBeenCalledWith('proj-123', 'CONSISTENCY');
    expect(result?.furthest_step).toBe('CONSISTENCY');
    expect(service.project()?.furthest_step).toBe('CONSISTENCY');
  });

  it('should throw error if updateFurthestStep is called without an active project', () => {
    let errorCaught: any;
    service.updateFurthestStep('CONSISTENCY').subscribe({
      error: (err) => {
        errorCaught = err;
      },
    });

    expect(errorCaught).toBeDefined();
    expect(projectsServiceMock.updateFurthestStep).not.toHaveBeenCalled();
  });
});
