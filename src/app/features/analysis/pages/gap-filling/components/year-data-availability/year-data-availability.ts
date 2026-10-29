import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, debounceTime, of, Subject, Subscription, switchMap } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideInfo, lucideRotateCcw } from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

import {
  GapFillingFilterParams,
  GapFillingFilterPreviewResponse,
  GapFillingFilterYearItem,
} from '../../models/gap-filling.model';
import { GapFillingService } from '../../../../services/gap-filling.service';

export interface YearFilterState {
  threshold: number;
  manualOverrides: Record<string, 'include' | 'exclude'>;
  keptCount: number;
  totalYears: number;
  validYears: number;
  source?: 'original' | 'filled';
}

@Component({
  selector: 'app-year-data-availability',
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    ...HlmBadgeImports,
    ...HlmButtonImports,
    ...HlmSkeletonImports,
    ...HlmTooltipImports,
  ],
  providers: [
    provideIcons({
      lucideInfo,
      lucideRotateCcw,
    }),
  ],
  templateUrl: './year-data-availability.html',
  styleUrl: './year-data-availability.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YearDataAvailability implements OnInit {
  private readonly gapFillingService = inject(GapFillingService);
  private readonly destroyRef = inject(DestroyRef);

  readonly projectId = input<string | null>(null);
  readonly source = input<'original' | 'filled' | null>(null);
  readonly initialThreshold = input<number | null>(null);
  readonly initialManualOverrides = input<Record<string, 'include' | 'exclude'> | null>(null);

  readonly stateChange = output<YearFilterState>();

  readonly threshold = signal<number>(90);
  readonly manualOverrides = signal<Record<string, 'include' | 'exclude'>>({});
  readonly preview = signal<GapFillingFilterPreviewResponse | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly placeholderCells = Array.from({ length: 35 }, (_, i) => i);

  private readonly sliderSubject$ = new Subject<number>();
  private readonly previewTrigger$ = new Subject<GapFillingFilterParams>();
  private previewSub: Subscription | null = null;
  private sliderSub: Subscription | null = null;

  readonly isDirty = computed<boolean>(() => {
    return this.threshold() !== 90 || Object.keys(this.manualOverrides()).length > 0;
  });

  readonly keptCount = computed<number>(() => this.preview()?.kept_count ?? 0);
  readonly totalYears = computed<number>(() => this.preview()?.total_years ?? 0);
  readonly validYears = computed<number>(() => {
    const prev = this.preview();
    if (!prev) return 0;
    if (prev.valid_years != null) return prev.valid_years;
    return (prev.years ?? []).filter(
      (y) => y.final_action === 'include' && y.completeness >= 90.0,
    ).length;
  });
  readonly isLowYears = computed<boolean>(
    () => this.keptCount() > 0 && this.keptCount() < 30,
  );

  readonly sliderTrackBackground = computed<string>(() => {
    const val = this.threshold();
    return `linear-gradient(to right, var(--primary) 0%, var(--primary) ${val}%, color-mix(in srgb, var(--foreground) 18%, transparent) ${val}%, color-mix(in srgb, var(--foreground) 18%, transparent) 100%)`;
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.sliderSub?.unsubscribe();
      this.previewSub?.unsubscribe();
    });

    this.sliderSub = this.sliderSubject$
      .pipe(debounceTime(250))
      .subscribe((val) => {
        this.previewTrigger$.next({
          threshold: val,
          manualOverrides: this.manualOverrides(),
          source: this.source() ?? undefined,
        });
      });

    this.previewSub = this.previewTrigger$
      .pipe(
        switchMap((params) => {
          const pid = this.projectId();
          if (!pid) return of(null);

          this.isLoading.set(true);
          this.error.set(null);

          return this.gapFillingService.filterPreview(pid, params).pipe(
            catchError((err) => {
              console.error('Erro ao carregar preview do filtro de anos:', err);
              this.error.set('Não foi possível atualizar o preview dos anos.');
              this.isLoading.set(false);
              return of(null);
            }),
          );
        }),
      )
      .subscribe((res) => {
        if (res) {
          this.preview.set(res);
          this.emitState();
        }
        this.isLoading.set(false);
      });
  }

  ngOnInit(): void {
    const initThresh = this.initialThreshold();
    if (initThresh != null) {
      this.threshold.set(initThresh);
    }
    const initOverrides = this.initialManualOverrides();
    if (initOverrides != null) {
      this.manualOverrides.set(initOverrides);
    }
    this.loadInitialPreview();
  }

  loadInitialPreview(): void {
    this.previewTrigger$.next({
      threshold: this.threshold(),
      manualOverrides: this.manualOverrides(),
      source: this.source() ?? undefined,
    });
  }

  onSliderInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = Number(input.value);
    this.threshold.set(val);
    this.sliderSubject$.next(val);
  }

  toggleYearAction(item: GapFillingFilterYearItem): void {
    const yearStr = String(item.year);
    const nextAction: 'include' | 'exclude' =
      item.final_action === 'include' ? 'exclude' : 'include';
    const currentOverrides = { ...this.manualOverrides() };

    if (nextAction === item.suggested_action) {
      delete currentOverrides[yearStr];
    } else {
      currentOverrides[yearStr] = nextAction;
    }

    this.manualOverrides.set(currentOverrides);
    this.previewTrigger$.next({
      threshold: this.threshold(),
      manualOverrides: currentOverrides,
      source: this.source() ?? undefined,
    });
  }

  resetToDefault(): void {
    this.threshold.set(90);
    this.manualOverrides.set({});
    this.previewTrigger$.next({
      threshold: 90,
      manualOverrides: {},
      source: this.source() ?? undefined,
    });
  }

  cellColor(completeness: number): string {
    if (completeness >= 90) return 'bg-(--success)';
    if (completeness >= 50) return 'bg-(--warning)';
    return 'bg-destructive';
  }

  formatMaxDate(dateStr?: string | null): string {
    if (!dateStr) return '';
    const parts = dateStr.slice(0, 10).split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  private emitState(): void {
    this.stateChange.emit({
      threshold: this.threshold(),
      manualOverrides: this.manualOverrides(),
      keptCount: this.keptCount(),
      totalYears: this.totalYears(),
      validYears: this.validYears(),
      source: this.source() ?? undefined,
    });
  }
}
