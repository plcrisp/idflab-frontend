export type HelpStepId =
  | 'map'
  | 'initial-visualization'
  | 'consistency-check'
  | 'gap-treatment'
  | 'temporal-resolution'
  | 'statistical-distribution'
  | 'historical-idf'
  | 'future-scenarios';

export const HELP_STEP_ORDER: readonly HelpStepId[] = [
  'map',
  'initial-visualization',
  'consistency-check',
  'gap-treatment',
  'temporal-resolution',
  'statistical-distribution',
  'historical-idf',
  'future-scenarios',
] as const;

export type HelpFigureKey = HelpStepId;

export interface HelpReference {
  citation: string;
  url?: string;
}

export interface HelpInterpretation {
  good?: string;
  warning?: string;
  problem?: string;
}

export type HelpNumberVisualType =
  | 'stat-number'
  | 'operability-bar'
  | 'network-chips'
  | 'cluster-circle';

export interface HelpNumberItem {
  visual: HelpNumberVisualType;
  title: string;
  description: string;
  value?: string;
}

export type HelpHowItWorksItem =
  | string
  | {
      title?: string;
      text: string;
    };

export interface HelpStepContent {
  id: HelpStepId;
  title: string;
  icon: string;
  figure: HelpFigureKey;
  summary: string;
  whyItMatters?: string;
  howItWorks?: HelpHowItWorksItem[];
  interpret?: HelpInterpretation;
  numbersGuide?: HelpNumberItem[];
  glossary?: Record<string, string>;
  references?: HelpReference[];
}

export type HelpTextToken =
  | { type: 'text'; value: string }
  | { type: 'glossary'; term: string; definition: string };
