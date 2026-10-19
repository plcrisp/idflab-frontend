import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule, DecimalPipe, TitleCasePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideInfo, lucideMapPin, lucideSparkles } from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { DisaggregationMethod } from '../temporal-disaggregation-path-selector/temporal-disaggregation-path-selector';
import { TemporalDisaggregationService } from '../../../../services/temporal-disaggregation.service';
import { BartlettLewisParams, CalibrationMetadata, CetesbFactorItem } from '../../models/temporal-disaggregation.model';
import { NeighborStation } from '../../../../../../core/models/api/station.model';

@Component({
  selector: 'app-temporal-disaggregation-config',
  standalone: true,
  imports: [
    CommonModule,
    TitleCasePipe,
    DecimalPipe,
    NgIcon,
    HlmBadgeImports,
    HlmButtonImports,
    HlmSkeletonImports,
    HlmSpinnerImports,
  ],
  providers: [
    provideIcons({
      lucideSparkles,
      lucideMapPin,
      lucideInfo,
    }),
  ],
  templateUrl: './temporal-disaggregation-config.html',
  styleUrl: './temporal-disaggregation-config.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemporalDisaggregationConfig implements OnInit {
  private readonly disaggregationService = inject(TemporalDisaggregationService);

  readonly method = input.required<DisaggregationMethod>();
  readonly isExecuting = input<boolean>(false);
  readonly isExecuted = input<boolean>(false);
  readonly calibrationStation = input<NeighborStation | null>(null);
  readonly isCalibrationReady = input<boolean>(false);
  readonly blParams = input<BartlettLewisParams | null>(null);
  readonly blMetadata = input<CalibrationMetadata | null>(null);
  readonly execute = output<void>();

  readonly factors = signal<CetesbFactorItem[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<boolean>(false);

  ngOnInit(): void {
    if (this.method() === 'cetesb') {
      this.loadFactors();
    } else {
      this.loading.set(false);
    }
  }

  loadFactors(): void {
    this.loading.set(true);
    this.error.set(false);

    this.disaggregationService.getCetesbFactors().subscribe({
      next: (data) => {
        this.factors.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[TemporalDisaggregationConfig] Erro ao carregar fatores CETESB:', err);
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  formatFactor(value: number): string {
    return value.toFixed(4).replace('.', ',');
  }

  formatParam(value?: number): string {
    if (value == null) return '-';
    return value.toFixed(4).replace('.', ',');
  }
}
