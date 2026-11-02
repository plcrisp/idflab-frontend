import { DistributionEnum } from '../../distribution/models/statistical-distribution.model';

export const DISTRIBUTION_FORMAL_NAMES: Record<DistributionEnum, string> = {
  GEV: 'Generalizada de Valores Extremos (GEV)',
  GUMBEL: 'Gumbel',
  PEARSON_3: 'Pearson Tipo III',
  LOGNORMAL_3P: 'Log-Normal',
  GLO: 'Logística Generalizada (GLO)',
};

export function getDistributionFormalName(code: DistributionEnum): string {
  return DISTRIBUTION_FORMAL_NAMES[code] ?? code;
}

export const HISTORICAL_IDF_TR_COLORS_DARK: Record<number, string> = {
  2: '#14b8a6',   // Teal
  5: '#38bdf8',   // Sky / Cobalt Blue (afastado de púrpura)
  10: '#c084fc',  // Purple (separação nítida de TR 5)
  25: '#f472b6',  // Pink / Fuchsia
  50: '#fb923c',  // Orange
  100: '#f87171', // Red
};

export const HISTORICAL_IDF_TR_COLORS_LIGHT: Record<number, string> = {
  2: '#0f766e',   // Teal 700
  5: '#0284c7',   // Sky 600
  10: '#7e22ce',  // Purple 700
  25: '#be185d',  // Pink 700
  50: '#c2410c',  // Orange 700
  100: '#b91c1c', // Red 700
};

export function getHistoricalIdfTrColor(tr: number, isLight: boolean): string {
  const map = isLight ? HISTORICAL_IDF_TR_COLORS_LIGHT : HISTORICAL_IDF_TR_COLORS_DARK;
  return map[tr] ?? (isLight ? '#b91c1c' : '#f87171');
}
