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

export interface HelpStepContent {
  id: HelpStepId;
  title: string;
  icon: string;
  figure: HelpFigureKey;
  summary: string;
  decision?: string;
  howItWorks?: string[];
  interpret?: HelpInterpretation;
  glossary?: Record<string, string>;
  references?: HelpReference[];
  insight?: (state: any) => string | null;
}

export type HelpTextToken =
  | { type: 'text'; value: string }
  | { type: 'glossary'; term: string; definition: string };
