import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideCalendar,
  lucideCheck,
  lucideChevronDown,
  lucideClock,
  lucideInfo,
  lucideLoader2,
  lucideMapPin,
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

import { StationSummary } from '../../../../../../core/models/api/station.model';
import {
  CLIMATE_MODEL_YEAR_RANGES,
  ClimateModel,
  ClimbraCell,
  FutureScenariosApplyRequest,
  ModelYearRange,
  SspScenario,
} from '../../models/future-scenarios.model';
import { FutureScenariosMap } from '../future-scenarios-map/future-scenarios-map';

@Component({
  selector: 'app-future-scenarios-config-card',
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    FutureScenariosMap,
    ...HlmButtonImports,
    ...HlmDropdownMenuImports,
    ...HlmTooltipImports,
  ],
  providers: [
    provideIcons({
      lucideActivity,
      lucideCalendar,
      lucideCheck,
      lucideChevronDown,
      lucideClock,
      lucideInfo,
      lucideLoader2,
      lucideMapPin,
      lucideTriangleAlert,
    }),
  ],
  templateUrl: './future-scenarios-config-card.html',
  styleUrl: './future-scenarios-config-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
})
export class FutureScenariosConfigCard {
  readonly station = input<StationSummary | null>(null);
  readonly cells = input<ClimbraCell[] | null>(null);
  readonly radiusKm = input<number>(10);
  readonly inheritedDistribution = input<string>('—');
  readonly inheritedDisaggregation = input<string>('—');
  readonly referenceWindow = input<string>('1980–2013');
  readonly isProcessing = input<boolean>(false);
  readonly isBlocked = input<boolean>(false);
  readonly canApplyBackend = input<boolean>(true);
  readonly hasValidMethod = input<boolean>(true);

  readonly selectedModel = model<ClimateModel>('MIROC6');
  readonly selectedSsp = model<SspScenario>('SSP245');
  readonly startYear = model<number>(2041);
  readonly endYear = model<number>(2070);

  readonly apply = output<void>();

  readonly modelOptions: readonly ClimateModel[] = [
    'MIROC6',
    'EC-EARTH3',
    'MRI-ESM2',
    'ACCESS-CM2',
    'HadGEM3-GC31-LL',
  ];

  readonly sspOptions: readonly { value: SspScenario; label: string }[] = [
    { value: 'SSP245', label: 'SSP2-4.5' },
    { value: 'SSP585', label: 'SSP5-8.5' },
  ];

  readonly currentModelRange = computed<ModelYearRange>(() => {
    const m = this.selectedModel();
    return CLIMATE_MODEL_YEAR_RANGES[m] ?? { minYear: 2015, maxYear: 2100 };
  });

  readonly selectedSspLabel = computed<string>(() => {
    return this.selectedSsp() === 'SSP585' ? 'SSP5-8.5' : 'SSP2-4.5';
  });

  readonly periodErrorMessage = computed<string | null>(() => {
    const s = this.startYear();
    const e = this.endYear();
    const range = this.currentModelRange();

    if (!s || !e || Number.isNaN(s) || Number.isNaN(e)) {
      return 'Informe os anos de início e fim da projeção.';
    }
    if (s < range.minYear || s > range.maxYear || e < range.minYear || e > range.maxYear) {
      return `Os anos devem estar entre ${range.minYear} e ${range.maxYear} para o modelo ${this.selectedModel()}.`;
    }
    if (s >= e) {
      return 'O ano inicial deve ser menor que o ano final.';
    }
    return null;
  });

  readonly periodWarningMessage = computed<string | null>(() => {
    if (this.periodErrorMessage()) return null;
    const s = this.startYear();
    const e = this.endYear();
    const count = e - s + 1;
    if (count < 30) {
      return `Janela de ${count} anos. A convenção climatológica da OMM recomenda pelo menos 30 anos para representatividade estatística.`;
    }
    return null;
  });

  readonly isPeriodValid = computed<boolean>(() => this.periodErrorMessage() === null);

  readonly canApply = computed<boolean>(() => {
    if (this.isProcessing() || this.isBlocked()) return false;
    return (
      this.canApplyBackend() &&
      this.hasValidMethod() &&
      this.isPeriodValid()
    );
  });

  selectModel(m: ClimateModel): void {
    if (this.isProcessing() || this.isBlocked()) return;
    this.selectedModel.set(m);
  }

  selectSsp(s: SspScenario): void {
    if (this.isProcessing() || this.isBlocked()) return;
    this.selectedSsp.set(s);
  }

  onStartYearInput(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    if (!Number.isNaN(val)) {
      this.startYear.set(Math.trunc(val));
    }
  }

  onEndYearInput(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    if (!Number.isNaN(val)) {
      this.endYear.set(Math.trunc(val));
    }
  }

  onApplyClick(): void {
    if (!this.canApply()) return;
    this.apply.emit();
  }
}

