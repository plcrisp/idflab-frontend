import { DistributionEnum } from '../models/statistical-distribution.model';

export interface DistributionConfig {
  code: DistributionEnum;
  name: string;
  fullName: string;
  parameterCount: number;
  paramCountLabel: string;
  colorVar: string;
  fallbackColor: string;
}

export const DISTRIBUTION_CONFIGS: Record<DistributionEnum, DistributionConfig> = {
  GEV: {
    code: 'GEV',
    name: 'GEV',
    fullName: 'Generalizada de Valores Extremos',
    parameterCount: 3,
    paramCountLabel: '3p',
    colorVar: '--dist-gev',
    fallbackColor: '#3b82f6',
  },
  GUMBEL: {
    code: 'GUMBEL',
    name: 'Gumbel',
    fullName: 'Gumbel (Tipo I)',
    parameterCount: 2,
    paramCountLabel: '2p',
    colorVar: '--dist-gumbel',
    fallbackColor: '#10b981',
  },
  LOGNORMAL_3P: {
    code: 'LOGNORMAL_3P',
    name: 'Log-Normal',
    fullName: 'Log-Normal 3 Parâmetros',
    parameterCount: 3,
    paramCountLabel: '3p',
    colorVar: '--dist-lognormal-3p',
    fallbackColor: '#8b5cf6',
  },
  GLO: {
    code: 'GLO',
    name: 'GLO',
    fullName: 'Generalizada Logística',
    parameterCount: 3,
    paramCountLabel: '3p',
    colorVar: '--dist-glo',
    fallbackColor: '#06b6d4',
  },
  PEARSON_3: {
    code: 'PEARSON_3',
    name: 'Pearson 3',
    fullName: 'Pearson Tipo III',
    parameterCount: 3,
    paramCountLabel: '3p',
    colorVar: '--dist-pearson-3',
    fallbackColor: '#f43f5e',
  },
};

export function getDistributionConfig(code: DistributionEnum): DistributionConfig {
  return (
    DISTRIBUTION_CONFIGS[code] ?? {
      code,
      name: code,
      fullName: code,
      parameterCount: 0,
      paramCountLabel: '',
      colorVar: '--primary',
      fallbackColor: '#49628b',
    }
  );
}

export function getDistributionColor(code: DistributionEnum): string {
  const cfg = DISTRIBUTION_CONFIGS[code];
  if (typeof window !== 'undefined' && cfg) {
    const val = getComputedStyle(document.documentElement).getPropertyValue(cfg.colorVar).trim();
    if (val) return val;
  }
  return cfg?.fallbackColor ?? '#49628b';
}

