import { effect, Injectable, Signal, signal } from '@angular/core';
import * as echarts from 'echarts';
import { EChartsOption } from 'echarts';

export interface ChartTokens {
  fontFamily: string;
  surface: string;
  border: string;
  borderSubtle: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryDark: string;
  primaryMid: string;
  error: string;
}

const themeTick = signal(0);
let themeObserverStarted = false;

function ensureThemeObserver(): void {
  if (themeObserverStarted) return;
  themeObserverStarted = true;

  const observer = new MutationObserver(() => themeTick.update((v) => v + 1));
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
}

function readTokens(): ChartTokens {
  const styles = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;

  return {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    surface: v('--surface', '#ffffff'),
    border: v('--border', '#d1d5db'),
    borderSubtle: v('--border-subtle', 'rgba(0, 0, 0, 0.07)'),
    text: v('--text', '#1f1f1f'),
    textMuted: v('--text-muted', '#1f1f1f'),
    textSubtle: v('--text-subtle', 'rgba(13, 13, 13, 0.4)'),
    primary: v('--primary', '#49628b'),
    primaryMid: v('--color-primary-700', '#2a3c58'),
    primaryDark: v('--color-primary-800', '#1e2a3f'),
    error: v('--color-error', '#ef4444'),
  };
}

function observeResize(element: HTMLElement, onResize: () => void): () => void {
  let raf: number | undefined;

  const observer = new ResizeObserver(() => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(onResize);
  });
  observer.observe(element);

  return () => {
    observer.disconnect();
    if (raf) cancelAnimationFrame(raf);
  };
}

@Injectable()
export class EchartsService<T = unknown> {
  private chart?: echarts.ECharts;
  private disposeResize?: () => void;

  constructor() {
    ensureThemeObserver();
  }

  getTokens(): ChartTokens {
    return readTokens();
  }

  setup(config: {
    container: () => HTMLDivElement;
    data: Signal<T | null>;
    buildOption: (data: T) => EChartsOption;
    onReady?: (chart: echarts.ECharts) => void;
  }): void {
    effect(() => {
      const data = config.data();
      themeTick();
      if (!data) return;

      if (!this.chart) {
        this.chart = echarts.init(config.container(), undefined, { renderer: 'svg' });
        this.disposeResize = observeResize(config.container(), () => this.chart?.resize());
      }
      this.chart.setOption(config.buildOption(data), true);
      config.onReady?.(this.chart);
    });
  }

  getInstance(): echarts.ECharts | undefined {
    return this.chart;
  }

  destroy(): void {
    this.chart?.dispose();
    this.disposeResize?.();
    this.chart = undefined;
  }
}
