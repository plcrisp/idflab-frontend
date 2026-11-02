import {
  AnnualRainfallData,
  FutureRainfallBar,
  MethodologyDifferentiator,
  StationPeakInfo,
} from '../models/auth-presentation.models';
import {
  generateFutureBars,
  generateHistoricalSeries,
} from '../utils/deterministic-series.util';

export const CMIP_VERSION = 'CMIP6';
export const ANO_INICIAL = 1961;
export const ANO_FINAL = 2026;
export const ANOS_INCOMPLETOS: number[] = [1968, 1982, 2004];

export const PEAK_DATA: StationPeakInfo = {
  year: 1988,
  value: 151.8,
  valueFormatted: '151,8 mm',
  date: '21/12/1988',
  city: 'RECORDE HISTÓRICO EM SÃO PAULO',
  stationName: 'Estação Mirante de Santana (INMET 83781) · 63 anos de série histórica diária',
  inmetCode: 'INMET 83781',
  completeYears: 63,
};

export const CHART_Y_MAX = 170;

// TODO: Substituir pelos máximos anuais reais de precipitação diária da estação 83781 (INMET - Mirante de Santana)
export const HISTORICAL_RAINFALL_SERIES: AnnualRainfallData[] = generateHistoricalSeries(
  ANO_INICIAL,
  ANO_FINAL,
  ANOS_INCOMPLETOS,
  PEAK_DATA.year,
  PEAK_DATA.value,
);

export const FUTURE_RAINFALL_BARS: FutureRainfallBar[] = generateFutureBars(24);

export const METHODOLOGY_DIFFERENTIATORS: MethodologyDifferentiator[] = [
  {
    id: 1,
    title: 'Fontes Oficiais',
    description: `INMET, CEMADEN, ANA e CLIMBra (${CMIP_VERSION})`,
    icon: 'lucideDatabase',
  },
  {
    id: 2,
    title: 'Machine Learning',
    description: 'Tratamento de falhas por Random Forest',
    icon: 'lucideCpu',
  },
  {
    id: 3,
    title: 'Desagregação',
    description: 'Chuva diária para sub-horária (CETESB / Bartlett-Lewis)',
    icon: 'lucideClock',
  },
  {
    id: 4,
    title: 'Cenários Futuros',
    description: `Curvas IDF com ${CMIP_VERSION} e correção de viés`,
    icon: 'lucideTrendingUp',
    isFuture: true,
  },
];

export const PRESENTATION_TEXTS = {
  brand: 'IDFLab',
  title: 'Da série histórica ao clima futuro, com método à vista.',
  subtitle: `Curvas IDF históricas e projetadas com ${CMIP_VERSION}, do dado bruto à equação, sem escrever código.`,
  differentiatorsHeader: 'DO DADO BRUTO À EQUAÇÃO IDF, EM 8 ETAPAS',
  reproducibilityNote: 'Cada escolha, parâmetro e versão fica registrado. Sua análise é reprodutível.',
} as const;
