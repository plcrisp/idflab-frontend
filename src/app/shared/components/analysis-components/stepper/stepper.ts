import { Component, computed, inject, Input } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AnalysisStep } from '../../../../features/analysis/models/analysis.models';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { MapService } from '../../../../core/services/utils/map.service';

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

  stepState(index: number): 'completed' | 'active' | 'upcoming' {
    const active = this.activeIndex();
    if (index < active) return 'completed';
    if (index === active) return 'active';
    return 'upcoming';
  }

  getStepLink(step: AnalysisStep, state: 'completed' | 'active' | 'upcoming'): any[] | null {
    if (state === 'upcoming') return null;

    if (step.path === 'interactive-map') {
      return ['/app/interactive-map'];
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
