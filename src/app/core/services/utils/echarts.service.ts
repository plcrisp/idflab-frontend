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

    surface: v('--card', '#ffffff'),

    border: v('--border', '#e2e8f0'),
    borderSubtle: v('--border', '#e2e8f0'),

    text: v('--foreground', '#020617'),
    textMuted: v('--muted-foreground', '#3f3f46'),
    textSubtle: v('--muted-foreground', '#3f3f46'),

    primary: v('--primary', '#49628b'),
    primaryMid: v('--primary-700', '#394b6b'),
    primaryDark: v('--primary-800', '#32415a'),

    error: v('--destructive', '#ef4444'),
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
    });
  }

  destroy(): void {
    this.chart?.dispose();
    this.disposeResize?.();
    this.chart = undefined;
  }
}
