import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { InitialVisualization } from './initial-visualization';
import { ProjectStateService } from '../../services/project-state.service';
import { InitialVisualizationStateService } from './services/initial-visualization-state.service';
import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { MapService } from '../../../../core/services/utils/map.service';
import { ProjectResponse } from '../../../../core/models/api/project.model';

describe('InitialVisualization component - onAdvance', () => {
  let component: InitialVisualization;
  let routerMock: { navigate: ReturnType<typeof vi.fn>; navigateByUrl: ReturnType<typeof vi.fn> };
  let projectStateMock: {
    project: ReturnType<typeof signal<ProjectResponse | null>>;
    updateFurthestStep: ReturnType<typeof vi.fn>;
  };
  let initialVisStateMock: {
    project: ReturnType<typeof signal<ProjectResponse | null>>;
    isAdvanceDisabled: ReturnType<typeof signal<boolean>>;
    selectYear: ReturnType<typeof vi.fn>;
    selectRange: ReturnType<typeof vi.fn>;
    downloadRawSeries: ReturnType<typeof vi.fn>;
  };
  let mainLayoutServiceMock: { setBreadcrumbs: ReturnType<typeof vi.fn> };
  let mapServiceMock: { selectStation: ReturnType<typeof vi.fn> };

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
    routerMock = { navigate: vi.fn(), navigateByUrl: vi.fn() };
    projectStateMock = {
      project: signal(mockProject),
      updateFurthestStep: vi.fn(),
    };
    initialVisStateMock = {
      project: signal(mockProject),
      isAdvanceDisabled: signal(false),
      selectYear: vi.fn(),
      selectRange: vi.fn(),
      downloadRawSeries: vi.fn(),
    };
    mainLayoutServiceMock = { setBreadcrumbs: vi.fn() };
    mapServiceMock = { selectStation: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        InitialVisualization,
        { provide: Router, useValue: routerMock },
        { provide: ProjectStateService, useValue: projectStateMock },
        { provide: InitialVisualizationStateService, useValue: initialVisStateMock },
        { provide: MainLayoutService, useValue: mainLayoutServiceMock },
        { provide: MapService, useValue: mapServiceMock },
      ],
    });

    component = TestBed.inject(InitialVisualization);
  });

  it('should call updateFurthestStep with CONSISTENCY and navigate on success', () => {
    const updated: ProjectResponse = { ...mockProject, furthest_step: 'CONSISTENCY' };
    projectStateMock.updateFurthestStep.mockReturnValue(of(updated));

    expect(component.isAdvancing()).toBe(false);

    component.onAdvance();

    expect(projectStateMock.updateFurthestStep).toHaveBeenCalledWith('CONSISTENCY');
    expect(component.isAdvancing()).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/app/analysis',
      'proj-123',
      'consistency-check',
    ]);
  });

  it('should not call updateFurthestStep if isAdvanceDisabled is true', () => {
    initialVisStateMock.isAdvanceDisabled.set(true);

    component.onAdvance();

    expect(projectStateMock.updateFurthestStep).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should handle error gracefully and reset isAdvancing', () => {
    projectStateMock.updateFurthestStep.mockReturnValue(
      throwError(() => new Error('Server error')),
    );

    component.onAdvance();

    expect(projectStateMock.updateFurthestStep).toHaveBeenCalledWith('CONSISTENCY');
    expect(component.isAdvancing()).toBe(false);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });
});
