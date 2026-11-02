import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnnualRainfallData, StationPeakInfo } from '../../models/auth-presentation.models';
import {
  ANO_FINAL,
  ANO_INICIAL,
  CHART_Y_MAX,
  FUTURE_RAINFALL_BARS,
  HISTORICAL_RAINFALL_SERIES,
  PEAK_DATA,
} from '../../constants/auth-presentation.constants';

export interface SvgBar {
  year: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  isPeak: boolean;
  index: number;
}

export interface SvgFutureBar {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
}

@Component({
  selector: 'app-hero-rainfall-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-rainfall-chart.html',
  styleUrl: './hero-rainfall-chart.scss',
})
export class HeroRainfallChart {
  readonly series = input<AnnualRainfallData[]>(HISTORICAL_RAINFALL_SERIES);
  readonly peakInfo = input<StationPeakInfo>(PEAK_DATA);
  readonly futureBars = input(FUTURE_RAINFALL_BARS);
  readonly yMax = input<number>(CHART_Y_MAX);

  readonly startYear = ANO_INICIAL;
  readonly endYear = ANO_FINAL;

  readonly viewWidth = 1000;
  readonly viewHeight = 135;
  readonly baseY = 130;
  readonly maxPlotHeight = 115;

  readonly peakLevelY = computed(() => {
    const peakVal = this.peakInfo().value;
    const h = (peakVal / this.yMax()) * this.maxPlotHeight;
    return parseFloat((this.baseY - h).toFixed(1));
  });

  readonly peakXPercent = computed(() => 28.95);

  readonly svgBars = computed<SvgBar[]>(() => {
    const list = this.series();
    const totalYears = list.length;
    if (totalYears === 0) return [];

    const startX = 12;
    const endX = 678;
    const stepX = (endX - startX) / (totalYears - 1);
    const bars: SvgBar[] = [];

    list.forEach((item, index) => {
      if (item.value === null) return;

      const isPeak = item.year === this.peakInfo().year;
      const height = (item.value / this.yMax()) * this.maxPlotHeight;
      const y = this.baseY - height;
      const width = isPeak ? 7.5 : 4.8;
      const x = parseFloat((startX + index * stepX - width / 2).toFixed(1));

      bars.push({
        year: item.year,
        x,
        y: parseFloat(y.toFixed(1)),
        width,
        height: parseFloat(height.toFixed(1)),
        value: item.value,
        isPeak,
        index,
      });
    });

    return bars;
  });

  readonly svgFutureBars = computed<SvgFutureBar[]>(() => {
    const list = this.futureBars();
    const count = list.length;
    const startX = 716;
    const endX = 988;
    const stepX = (endX - startX) / (count - 1);

    return list.map((bar, index) => {
      const height = (bar.value / this.yMax()) * this.maxPlotHeight;
      const y = this.baseY - height;
      const x = parseFloat((startX + index * stepX - 2.4).toFixed(1));

      return {
        index,
        x,
        y: parseFloat(y.toFixed(1)),
        width: 4.8,
        height: parseFloat(height.toFixed(1)),
        opacity: bar.opacity,
      };
    });
  });
}
