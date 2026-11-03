export interface RainfallBarItem {
  year: number;
  value: number;
  valueFormatted: string;
  tooltipText: string;
  isPeak: boolean;
  isFuture: boolean;
  isAboveRecord?: boolean;
  opacity: number;
}

export interface PeakRecordDetails {
  year: number;
  value: number;
  valueFormatted: string;
  date: string;
  city: string;
  headline: string;
  stationName: string;
  inmetCode: string;
  completeYears: number;
}

export interface PresentationDifferentiator {
  id: number;
  icon: string;
  label: string;
}

export interface PresentationTexts {
  brand: string;
  title: string;
  subtitle: string;
  footer: string;
}

export const PEAK_RECORD: PeakRecordDetails = {
  year: 1988,
  value: 151.8,
  valueFormatted: '151,8 mm',
  date: '21/12/1988',
  city: 'SÃO PAULO',
  headline: 'RECORDE HISTÓRICO · SÃO PAULO · 21/12/1988',
  stationName: 'Estação Mirante de Santana (INMET 83781) · 63 anos de série diária',
  inmetCode: 'INMET 83781',
  completeYears: 63,
};

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatPtBr(val: number): string {
  return val.toFixed(1).replace('.', ',') + ' mm';
}

function buildSeries(): RainfallBarItem[] {
  const prng = mulberry32(83781);
  const items: RainfallBarItem[] = [];

  for (let year = 1962; year <= 2026; year += 2) {
    if (year === PEAK_RECORD.year) {
      items.push({
        year,
        value: PEAK_RECORD.value,
        valueFormatted: PEAK_RECORD.valueFormatted,
        tooltipText: `1988 · 151,8 mm · Recorde Histórico — ${PEAK_RECORD.stationName}`,
        isPeak: true,
        isFuture: false,
        opacity: 1.0,
      });
      continue;
    }

    const cycle = Math.sin((year - 1962) * 0.35) * 12;
    const noise = (prng() - 0.5) * 36;
    const value = parseFloat(Math.max(52.4, Math.min(108.5, 78 + cycle + noise)).toFixed(1));
    const valueFormatted = formatPtBr(value);

    items.push({
      year,
      value,
      valueFormatted,
      tooltipText: `${year} · ${valueFormatted}`,
      isPeak: false,
      isFuture: false,
      opacity: 1.0,
    });
  }

  const recordExceedingYears = [2064, 2086, 2092];

  for (let year = 2028; year <= 2100; year += 2) {
    const progress = (year - 2028) / 72;
    const r = prng();
    const isAboveRecord = recordExceedingYears.includes(year);
    let val: number;

    if (isAboveRecord) {
      val = year === 2064 ? 159.6 : year === 2086 ? 157.4 : 155.8;
    } else {
      val = Math.max(62.0, Math.min(136.0, 78 + progress * 34 + (r - 0.45) * 55));
    }

    const value = parseFloat(val.toFixed(1));
    const valueFormatted = formatPtBr(value);
    const tooltipText = isAboveRecord
      ? `${year} · ${valueFormatted} · Projeção · Acima do recorde`
      : `${year} · ${valueFormatted} · Projeção`;

    items.push({
      year,
      value,
      valueFormatted,
      tooltipText,
      isPeak: false,
      isFuture: true,
      isAboveRecord,
      opacity: isAboveRecord ? 1.0 : 0.45,
    });
  }

  return items;
}

export const LOGIN_HERO_SERIES: RainfallBarItem[] = buildSeries();

export const LOGIN_HERO_DIFFERENTIATORS: PresentationDifferentiator[] = [
  {
    id: 1,
    icon: 'lucideDatabase',
    label: 'INMET, CEMADEN e ANA',
  },
  {
    id: 2,
    icon: 'lucideSliders',
    label: 'Tudo registrado e reprodutível',
  },
  {
    id: 3,
    icon: 'lucideTrendingUp',
    label: 'Projeções CMIP6 até 2100',
  },
];

export const LOGIN_HERO_TEXTS: PresentationTexts = {
  brand: 'IDFLab',
  title: 'Da série bruta à curva IDF,\netapa por etapa.',
  subtitle: 'Um fluxo guiado: você escolhe os métodos, o IDFLab executa e registra cada resultado.',
  footer: 'Projeto de pesquisa · UNIFEI',
};
