import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideCheck,
  lucideChevronDown,
  lucideChevronRight,
  lucideCircleHelp,
  lucideClock,
  lucideCode2,
  lucideCoins,
  lucideDatabase,
  lucideDownload,
  lucideDroplets,
  lucideExternalLink,
  lucideFilter,
  lucideMap,
  lucideRotateCcw,
  lucideShieldCheck,
  lucideSlidersHorizontal,
  lucideSparkles,
  lucideTrendingUp,
  lucideTriangleAlert,
  lucideZap,
} from '@ng-icons/lucide';
import {
  HelpReference,
  HelpStepId,
} from '../../../../../core/models/contextual-help.model';

interface OverviewStepItem {
  id: HelpStepId;
  stepNumber: string;
  title: string;
  description: string;
  icon: string;
}

interface PlatformDifferentiator {
  title: string;
  description: string;
  icon: string;
}

const STEPPER_ITEMS: OverviewStepItem[] = [
  { id: 'map', stepNumber: '01', title: 'Mapa', description: 'Escolha da estação e período histórico', icon: 'lucideMap' },
  { id: 'initial-visualization', stepNumber: '02', title: 'Visualização inicial', description: 'Inspeção de falhas e extensão temporal', icon: 'lucideActivity' },
  { id: 'consistency-check', stepNumber: '03', title: 'Verificação de consistência', description: 'Dupla massa com estação vizinha de apoio', icon: 'lucideShieldCheck' },
  { id: 'gap-treatment', stepNumber: '04', title: 'Tratamento de falhas', description: 'Preenchimento ou seleção de anos válidos', icon: 'lucideFilter' },
  { id: 'temporal-resolution', stepNumber: '05', title: 'Resolução temporal', description: 'Desagregação diária para sub-horária', icon: 'lucideClock' },
  { id: 'statistical-distribution', stepNumber: '06', title: 'Distribuição estatística', description: 'Ajuste probabilístico aos máximos anuais', icon: 'lucideTrendingUp' },
  { id: 'historical-idf', stepNumber: '07', title: 'IDF histórica', description: 'Parâmetros calibrados e curvas ajustadas', icon: 'lucideDroplets' },
  { id: 'future-scenarios', stepNumber: '08', title: 'Cenários futuros', description: 'Projeções climáticas até 2100 (CLIMBra)', icon: 'lucideSparkles' },
];

const PLATFORM_DIFFERENTIATORS: PlatformDifferentiator[] = [
  {
    title: 'Sem programação',
    description: 'Tudo pela interface, sem código.',
    icon: 'lucideCode2',
  },
  {
    title: 'Você no controle',
    description: 'Ajuste os parâmetros em cada etapa.',
    icon: 'lucideSlidersHorizontal',
  },
  {
    title: 'Reprodutível',
    description: 'Decisões e parâmetros ficam registrados.',
    icon: 'lucideRotateCcw',
  },
  {
    title: 'Bases oficiais',
    description: 'ANA, INMET e CEMADEN.',
    icon: 'lucideDatabase',
  },
  {
    title: 'Processamento em segundo plano',
    description: 'Cálculos pesados sem travar a tela.',
    icon: 'lucideZap',
  },
  {
    title: 'Exportável',
    description: 'Séries e gráficos em CSV e PDF.',
    icon: 'lucideDownload',
  },
];

@Component({
  selector: 'app-help-overview-tab',
  standalone: true,
  imports: [CommonModule, NgIcon],
  providers: [
    provideIcons({
      lucideActivity,
      lucideCheck,
      lucideChevronDown,
      lucideChevronRight,
      lucideCircleHelp,
      lucideClock,
      lucideCode2,
      lucideCoins,
      lucideDatabase,
      lucideDownload,
      lucideDroplets,
      lucideExternalLink,
      lucideFilter,
      lucideMap,
      lucideRotateCcw,
      lucideShieldCheck,
      lucideSlidersHorizontal,
      lucideSparkles,
      lucideTrendingUp,
      lucideTriangleAlert,
      lucideZap,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
  templateUrl: './help-overview-tab.html',
  styleUrl: './help-overview-tab.scss',
})
export class HelpOverviewTab {
  readonly currentStepIndex = input<number>(-1);
  readonly generalReferences = input<readonly HelpReference[]>([]);

  readonly stepSelect = output<HelpStepId>();

  readonly openIdf = signal<boolean>(false);
  readonly openWhy = signal<boolean>(false);
  readonly openHow = signal<boolean>(false);

  readonly stepperSteps = STEPPER_ITEMS;
  readonly platformDifferentiators = PLATFORM_DIFFERENTIATORS;

  readonly hasCurrentStep = computed(() => {
    return this.currentStepIndex() >= 0;
  });

  toggleIdf(card?: HTMLElement) {
    this.openIdf.update((v) => !v);
    if (this.openIdf() && card) {
      this.scrollToAccordion(card);
    }
  }

  toggleWhy(card?: HTMLElement) {
    this.openWhy.update((v) => !v);
    if (this.openWhy() && card) {
      this.scrollToAccordion(card);
    }
  }

  toggleHow(card?: HTMLElement) {
    this.openHow.update((v) => !v);
    if (this.openHow() && card) {
      this.scrollToAccordion(card);
    }
  }

  private scrollToAccordion(element: HTMLElement) {
    setTimeout(() => {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      element.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }, 60);
  }
}
