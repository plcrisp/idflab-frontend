import { Component, computed, inject, Input } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { MapService } from '../../../../../core/services/utils/map.service';
import { AnalysisStep } from '../../models/analysis.models';
import { StepEnum } from '../../../../../core/models/api/project.model';
import { ProjectStepResponse } from '../../../../../core/models/api/project-step.model';
import { ProjectStateService } from '../../../services/project-state.service';
import { getStepForRoute, isStepBeyond } from '../../../../../core/utils/project-step.utils';
import { getDistributionConfig } from '../../../pages/distribution/constants/statistical-distribution.constants';
import { DistributionEnum } from '../../../pages/distribution/models/statistical-distribution.model';

export interface StepSubtitle {
  text: string;
  tooltip: string;
  icon?: string;
}

@Component({
  selector: 'app-stepper',
  standalone: false,
  templateUrl: './stepper.html',
  styleUrl: './stepper.scss',
})
export class Stepper {
  private router = inject(Router);
  private mapService = inject(MapService);

  @Input({ required: true }) steps: AnalysisStep[] = [];
  @Input({ required: true }) station_id: string | undefined = '';
  @Input() furthestStep?: StepEnum;
  @Input() projectSteps: ProjectStepResponse[] = [];

  private projectState = inject(ProjectStateService, { optional: true });
  private titleCasePipe = new TitleCasePipe();

  readonly effectiveProjectSteps = computed(() => {
    if (this.projectSteps && this.projectSteps.length > 0) {
      return this.projectSteps;
    }
    return this.projectState?.projectSteps() ?? [];
  });

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  activeIndex = computed(() => {
    const url = this.currentUrl();
    return this.steps.findIndex((step) => url.includes(step.path));
  });

  progressPercent = computed(() => {
    const total = this.steps.length;
    const index = this.activeIndex();
    if (total <= 1 || index < 0) return 0;
    return (index / (total - 1)) * 100;
  });

  isStepClickable(step: AnalysisStep, index: number): boolean {
    if (step.path === 'interactive-map') return true;
    const active = this.activeIndex();
    if (index <= active) return true;
    if (this.furthestStep) {
      const stepEnum = getStepForRoute(step.path);
      if (stepEnum && !isStepBeyond(stepEnum, this.furthestStep)) {
        return true;
      }
    }
    return false;
  }

  stepState(index: number): 'completed' | 'active' | 'upcoming' {
    const active = this.activeIndex();
    if (index < active) return 'completed';
    if (index === active) return 'active';
    return 'upcoming';
  }

  getStepLink(step: AnalysisStep, state: 'completed' | 'active' | 'upcoming'): any[] | null {
    if (step.path === 'interactive-map') {
      return ['/app/interactive-map'];
    }

    if (state === 'upcoming') {
      if (this.furthestStep) {
        const stepEnum = getStepForRoute(step.path);
        if (stepEnum && !isStepBeyond(stepEnum, this.furthestStep)) {
          return [step.path];
        }
      }
      return null;
    }

    return [step.path];
  }

  onStepClick(step: AnalysisStep): void {
    console.log('clicou em', step.path, 'station_id:', this.station_id);
    if (step.path === 'interactive-map' && this.station_id) {
      this.mapService.selectStation(this.station_id);
    }
  }

  isStepCompleted(stepEnum: StepEnum): boolean {
    if (this.furthestStep && isStepBeyond(stepEnum, this.furthestStep)) {
      return false;
    }
    const steps = this.effectiveProjectSteps();
    const record = steps.find((s) => s.step === stepEnum);
    return record?.status === 'COMPLETED';
  }

  stepSubtitle(step: AnalysisStep): StepSubtitle | null {
    const stepEnum = getStepForRoute(step.path);
    if (!stepEnum) return null;

    if (!this.isStepCompleted(stepEnum)) {
      return null;
    }

    const steps = this.effectiveProjectSteps();
    const record = steps.find((s) => s.step === stepEnum);
    if (!record) return null;

    const params = (record.params as Record<string, any>) || {};
    const result = (record.result as Record<string, any>) || {};

    if (stepEnum === 'GAP_FILLING') {
      const fill =
        params['fill'] ||
        (params['neighbor_station_id']
          ? {
              neighbor_station_id: params['neighbor_station_id'],
              neighbor_station_name: params['neighbor_station_name'],
            }
          : null);

      if (fill && fill['neighbor_station_id']) {
        const rawName =
          fill['neighbor_station_name'] ||
          (record as any)['neighbor_station_name'];
        const stationName = this.titleCasePipe.transform(rawName || 'Vizinha');
        return {
          text: 'Preenchida com ' + stationName,
          tooltip: 'Preenchida com ' + stationName,
        };
      }

      const filterResult = result['filter'] || {};
      const removedYears: number[] =
        filterResult['removed_years'] || params['excluded_years'] || [];
      if (removedYears.length > 0) {
        return {
          text: 'Anos removidos',
          tooltip: 'Anos removidos',
        };
      }

      return null;
    }

    if (stepEnum === 'TEMPORAL_RESOLUTION') {
      const methodRaw = String(params['method'] || result['method'] || '').toUpperCase();
      if (methodRaw.includes('DIRECT') || methodRaw.includes('AGREGACAO')) {
        return {
          text: 'Agregação direta',
          tooltip: 'Agregação direta',
        };
      }
      if (methodRaw.includes('BARTLETT')) {
        const calibRaw =
          params['calibration_station_name'] ||
          result['calibration_metadata']?.calibration_station_name;
        const calibName = calibRaw ? this.titleCasePipe.transform(calibRaw) : null;
        return {
          text: 'Bartlett-Lewis',
          tooltip: calibName ? 'Bartlett-Lewis · ' + calibName : 'Bartlett-Lewis',
        };
      }
      if (methodRaw.includes('CETESB')) {
        return {
          text: 'Fatores CETESB',
          tooltip: 'Fatores CETESB',
        };
      }
      return null;
    }

    if (stepEnum === 'DISTRIBUTION') {
      const selectedDist =
        params['selected_distribution'] || result['suggested_distribution'];
      if (!selectedDist) return null;
      const code = String(selectedDist).toUpperCase() as DistributionEnum;
      const cfg = getDistributionConfig(code);
      const name = cfg?.name || code;
      return {
        text: name,
        tooltip: name,
      };
    }

    return null;
  }
}
