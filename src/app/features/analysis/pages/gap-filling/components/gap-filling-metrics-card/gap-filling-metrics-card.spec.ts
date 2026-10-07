import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, beforeEach, expect, it, vi } from 'vitest';

import { GapFillingMetricsCard } from './gap-filling-metrics-card';
import { GapFillingService } from '../../../../services/gap-filling.service';
import { NeighborStation } from '../../../../../../core/models/api/station.model';
import { ActiveJobItem } from '../../../../../../core/models/api/notification.model';
import { ConfirmationStatus, NeighborProgressInfo } from '../../../../shared/models/analysis.models';
import { GapFillingPreMetrics } from '../../models/gap-filling-pre-metrics.model';

@Component({
  standalone: true,
  imports: [GapFillingMetricsCard],
  template: `
    <app-gap-filling-metrics-card
      [projectId]="projectId()"
      [activeStation]="activeStation()"
      [selectedStation]="selectedStation()"
      [status]="status()"
      [job]="job()"
      [progress]="progress()"
      [totalYears]="totalYears()"
      [disabled]="disabled()"
      (changeStation)="onChangeStation()"
      (fillGapsRequested)="onFillGaps()"
      (skipStepRequested)="onSkipStep()"
    />
  `,
})
class TestHostComponent {
  projectId = signal<string | null>('proj-123');
  activeStation = signal<NeighborStation | null>(null);
  selectedStation = signal<NeighborStation | null>(null);
  status = signal<ConfirmationStatus>('idle');
  job = signal<ActiveJobItem | null>(null);
  progress = signal<NeighborProgressInfo | null>(null);
  totalYears = signal<number | null>(40);
  disabled = signal<boolean>(false);

  changeStationCount = 0;
  fillGapsCount = 0;
  skipStepCount = 0;

  onChangeStation(): void {
    this.changeStationCount++;
  }

  onFillGaps(): void {
    this.fillGapsCount++;
  }

  onSkipStep(): void {
    this.skipStepCount++;
  }
}

const mockStation: NeighborStation = {
  id: 'st-neighbor-1',
  code: '83726',
  name: 'Estação Campinas',
  source: 'INMET',
  latitude: -22.9,
  longitude: -47.06,
  distance_km: 18.4,
  temporal_resolution: 'daily',
  operation_start_date: '1970-01-01',
  last_data_date: '2023-12-31',
  city: 'Campinas',
  state: 'SP',
};

const mockMetrics: GapFillingPreMetrics = {
  pearson_r: 0.82,
  valid_pairs: 10000,
  overlap_years: 12,
  fillable_coverage_pct: 78.5,
  total_gaps: 150,
  fillable_gaps: 120,
  remaining_gaps: 30,
  complete_years_before: 15,
  complete_years_predicted: 25,
  longest_gap_days: 14,
  accumulated_ratio: 0.98,
};

describe('GapFillingMetricsCard', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let gapFillingServiceMock: {
    getPreMetrics: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    gapFillingServiceMock = {
      getPreMetrics: vi.fn().mockReturnValue(
        of({
          metrics: mockMetrics,
          warnings: ['LONG_GAP'],
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [TestHostComponent, GapFillingMetricsCard],
      providers: [
        { provide: GapFillingService, useValue: gapFillingServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display job progress card when status is loading', () => {
    host.status.set('loading');
    host.selectedStation.set(mockStation);
    host.progress.set({ message: 'Baixando dados da estação...', percentage: 45 });
    fixture.detectChanges();

    const progressCard = fixture.debugElement.query(By.css('app-job-progress-card'));
    expect(progressCard).not.toBeNull();

    const preMetricsPanel = fixture.debugElement.query(By.css('app-gap-filling-pre-metrics-panel'));
    expect(preMetricsPanel).toBeNull();
  });

  it('should display pre-metrics panel and fetch metrics when status becomes ready', () => {
    host.activeStation.set(mockStation);
    host.status.set('ready');
    fixture.detectChanges();

    expect(gapFillingServiceMock.getPreMetrics).toHaveBeenCalledWith('proj-123', 'st-neighbor-1', false);

    const progressCard = fixture.debugElement.query(By.css('app-job-progress-card'));
    expect(progressCard).toBeNull();

    const preMetricsPanel = fixture.debugElement.query(By.css('app-gap-filling-pre-metrics-panel'));
    expect(preMetricsPanel).not.toBeNull();
  });

  it('should emit changeStation when clicking Trocar de estação', () => {
    host.activeStation.set(mockStation);
    host.status.set('ready');
    fixture.detectChanges();

    const changeBtn = fixture.debugElement.query(
      By.css('button[hlmBtn]'),
    );
    expect(changeBtn).not.toBeNull();
    changeBtn.nativeElement.click();
    fixture.detectChanges();

    expect(host.changeStationCount).toBe(1);
  });

  it('should handle error when pre-metrics call fails and allow retry', () => {
    gapFillingServiceMock.getPreMetrics.mockReturnValueOnce(
      throwError(() => new Error('Server error')),
    );

    host.activeStation.set(mockStation);
    host.status.set('ready');
    fixture.detectChanges();

    const cardComponent = fixture.debugElement.query(By.directive(GapFillingMetricsCard)).componentInstance as GapFillingMetricsCard;
    expect(cardComponent.metricsError()).not.toBeNull();

    // Now retry
    gapFillingServiceMock.getPreMetrics.mockReturnValueOnce(
      of({ metrics: mockMetrics, warnings: [] }),
    );
    cardComponent.retryMetrics();
    fixture.detectChanges();

    expect(gapFillingServiceMock.getPreMetrics).toHaveBeenCalledWith('proj-123', 'st-neighbor-1', true);
  });
});
