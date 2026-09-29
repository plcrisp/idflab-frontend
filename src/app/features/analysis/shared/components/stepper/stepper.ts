import { Component, computed, inject, Input } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { MapService } from '../../../../../core/services/utils/map.service';
import { AnalysisStep } from '../../models/analysis.models';
import { StepEnum } from '../../../../../core/models/api/project.model';
import { getStepForRoute, isStepBeyond } from '../../../../../core/utils/project-step.utils';

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
}
