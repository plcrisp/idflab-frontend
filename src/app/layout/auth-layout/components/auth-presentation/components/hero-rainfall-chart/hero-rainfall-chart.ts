import {
  Component,
  OnInit,
  OnDestroy,
  computed,
  signal,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import {
  LOGIN_HERO_SERIES,
  PEAK_RECORD,
  RainfallBarItem,
  PeakRecordDetails,
} from '../../data/login-hero.data';

export interface ComputedSvgBar extends RainfallBarItem {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
}

@Component({
  selector: 'app-hero-rainfall-chart',
  standalone: true,
  imports: [CommonModule, ...HlmTooltipImports],
  templateUrl: './hero-rainfall-chart.html',
  styleUrl: './hero-rainfall-chart.scss',
})
export class HeroRainfallChart implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  readonly series: RainfallBarItem[] = LOGIN_HERO_SERIES;
  readonly peakRecord: PeakRecordDetails = PEAK_RECORD;

  readonly displayNumber = signal<string>(PEAK_RECORD.valueFormatted);

  private timerId: number | null = null;
  private animFrameId: number | null = null;

  readonly viewWidth = 1000;
  readonly viewHeight = 350;

  readonly startX = 13;
  readonly barWidth = 8;
  readonly stepX = 14;
  readonly totalBars = 70;

  readonly peakIndex = (1988 - 1962) / 2;
  readonly peakX = this.startX + this.peakIndex * this.stepX;
  readonly peakCenterX = this.peakX + this.barWidth / 2;
  readonly peakXPercent = parseFloat(((this.peakCenterX / this.viewWidth) * 100).toFixed(2));

  readonly dividerIndex = 32;
  readonly dividerX = 472;
  readonly dividerXPercent = parseFloat(((this.dividerX / this.viewWidth) * 100).toFixed(2));
  readonly dividerStartY = 54;

  readonly lastBarIndex = 69;
  readonly lastBarX = this.startX + this.lastBarIndex * this.stepX;
  readonly lastBarRight = this.lastBarX + this.barWidth;
  readonly lastBarRightPercent = parseFloat((((this.viewWidth - this.lastBarRight) / this.viewWidth) * 100).toFixed(2));

  readonly yMax = 180;
  readonly baseY = 348;
  readonly maxPlotHeight = 278;

  readonly peakLevelY = this.baseY - Math.round((this.peakRecord.value / this.yMax) * this.maxPlotHeight);
  readonly flagBottomPercent = parseFloat((100 - (this.peakLevelY / this.viewHeight) * 100).toFixed(2));

  readonly historicalBars = computed<ComputedSvgBar[]>(() => {
    return this.series.slice(0, 33).map((item, index) => {
      const height = Math.round((item.value / this.yMax) * this.maxPlotHeight);
      const y = this.baseY - height;
      const x = this.startX + index * this.stepX;

      return {
        ...item,
        x,
        y,
        width: this.barWidth,
        height,
        index,
      };
    });
  });

  readonly futureBars = computed<ComputedSvgBar[]>(() => {
    return this.series.slice(33).map((item, futureIndex) => {
      const globalIndex = 33 + futureIndex;
      const height = Math.round((item.value / this.yMax) * this.maxPlotHeight);
      const y = this.baseY - height;
      const x = this.startX + globalIndex * this.stepX;

      return {
        ...item,
        x,
        y,
        width: this.barWidth,
        height,
        index: futureIndex,
      };
    });
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.displayNumber.set(this.peakRecord.valueFormatted);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.displayNumber.set(this.peakRecord.valueFormatted);
      return;
    }

    this.displayNumber.set('0,0 mm');

    this.timerId = window.setTimeout(() => {
      this.startCountUp();
    }, 1350);
  }

  private startCountUp(): void {
    const startVal = 0;
    const targetVal = this.peakRecord.value;
    const duration = 650;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (targetVal - startVal) * ease;

      this.displayNumber.set(current.toFixed(1).replace('.', ',') + ' mm');

      if (progress < 1) {
        this.animFrameId = requestAnimationFrame(step);
      } else {
        this.displayNumber.set(this.peakRecord.valueFormatted);
      }
    };

    this.animFrameId = requestAnimationFrame(step);
  }

  ngOnDestroy(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
  }
}
