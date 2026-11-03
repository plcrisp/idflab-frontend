import {
  HelpReference,
  HelpStepContent,
  HelpStepId,
} from '../../../../core/models/contextual-help.model';
import { GLOBAL_GLOSSARY } from './glossary.data';
import { MAP_STEP_HELP } from './steps/01-map.data';
import { INITIAL_VISUALIZATION_STEP_HELP } from './steps/02-initial-visualization.data';
import { CONSISTENCY_CHECK_STEP_HELP } from './steps/03-consistency-check.data';
import { GAP_TREATMENT_STEP_HELP } from './steps/04-gap-treatment.data';
import { TEMPORAL_RESOLUTION_STEP_HELP } from './steps/05-temporal-resolution.data';
import { STATISTICAL_DISTRIBUTION_STEP_HELP } from './steps/06-statistical-distribution.data';
import { HISTORICAL_IDF_STEP_HELP } from './steps/07-historical-idf.data';
import { FUTURE_SCENARIOS_STEP_HELP } from './steps/08-future-scenarios.data';

export { GLOBAL_GLOSSARY } from './glossary.data';

export const HELP_GENERAL_REFERENCES: readonly HelpReference[] = [
  {
    citation:
      'Tucci, C. E. M. Hidrologia: ciência e aplicação. 4ª ed. Porto Alegre: Editora da UFRGS/ABRH, 2012.',
  },
  {
    citation: 'Chow, V. T.; Maidment, D. R.; Mays, L. W. Applied Hydrology. McGraw-Hill, 1988.',
  },
] as const;

function mergeWithGlobalGlossary(step: HelpStepContent): HelpStepContent {
  return {
    ...step,
    glossary: {
      ...GLOBAL_GLOSSARY,
      ...(step.glossary ?? {}),
    },
  };
}

export const HELP_CONTENT_DATA: Record<HelpStepId, HelpStepContent> = {
  map: mergeWithGlobalGlossary(MAP_STEP_HELP),
  'initial-visualization': mergeWithGlobalGlossary(INITIAL_VISUALIZATION_STEP_HELP),
  'consistency-check': mergeWithGlobalGlossary(CONSISTENCY_CHECK_STEP_HELP),
  'gap-treatment': mergeWithGlobalGlossary(GAP_TREATMENT_STEP_HELP),
  'temporal-resolution': mergeWithGlobalGlossary(TEMPORAL_RESOLUTION_STEP_HELP),
  'statistical-distribution': mergeWithGlobalGlossary(STATISTICAL_DISTRIBUTION_STEP_HELP),
  'historical-idf': mergeWithGlobalGlossary(HISTORICAL_IDF_STEP_HELP),
  'future-scenarios': mergeWithGlobalGlossary(FUTURE_SCENARIOS_STEP_HELP),
};
