import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { DisaggregationMethod } from '../temporal-disaggregation-path-selector/temporal-disaggregation-path-selector';
import { TemporalDisaggregationService } from '../../../../services/temporal-disaggregation.service';
import { CetesbFactorItem } from '../../models/temporal-disaggregation.model';

@Component({
  selector: 'app-temporal-disaggregation-config',
  standalone: true,
  imports: [
    CommonModule,
    HlmBadgeImports,
    HlmButtonImports,
    HlmSkeletonImports,
    HlmSpinnerImports,
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
  readonly execute = output<void>();

  readonly factors = signal<CetesbFactorItem[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<boolean>(false);

  ngOnInit(): void {
    this.loadFactors();
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
}

