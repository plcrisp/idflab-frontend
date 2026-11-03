import { HelpReference, HelpStepContent, HelpStepId } from '../../../../core/models/contextual-help.model';

export const HELP_GENERAL_REFERENCES: readonly HelpReference[] = [
  {
    citation:
      'Tucci, C. E. M. Hidrologia: ciência e aplicação. 4ª ed. Porto Alegre: Editora da UFRGS/ABRH, 2012.',
  },
  {
    citation: 'Chow, V. T.; Maidment, D. R.; Mays, L. W. Applied Hydrology. McGraw-Hill, 1988.',
  },
] as const;

export const HELP_CONTENT_DATA: Record<HelpStepId, HelpStepContent> = {
  map: {
    id: 'map',
    title: 'Mapa',
    icon: 'lucideMap',
    figure: 'map',
    summary: 'Selecione a estação pluviométrica no mapa e defina a janela histórica de dados.',
  },
  'initial-visualization': {
    id: 'initial-visualization',
    title: 'Visualização inicial',
    icon: 'lucideActivity',
    figure: 'initial-visualization',
    summary:
      'Explore o histórico de chuvas diárias, identifique lacunas e avalie a extensão da série temporal.',
  },
  'consistency-check': {
    id: 'consistency-check',
    title: 'Verificação de consistência',
    icon: 'lucideShieldCheck',
    figure: 'consistency-check',
    summary:
      'Avalie a confiabilidade dos registros comparando a estação de interesse com estações vizinhas.',
  },
  'gap-treatment': {
    id: 'gap-treatment',
    title: 'Tratamento de falhas',
    icon: 'lucideFilter',
    figure: 'gap-treatment',
    summary:
      'Selecione anos completos ou preencha falhas com dados de estações de referência.',
  },
  'temporal-resolution': {
    id: 'temporal-resolution',
    title: 'Resolução temporal',
    icon: 'lucideClock',
    figure: 'temporal-resolution',
    summary:
      'Desagregue medições diárias em durações menores usando relações probabilísticas consolidadas.',
  },
  'statistical-distribution': {
    id: 'statistical-distribution',
    title: 'Distribuição estatística',
    icon: 'lucideTrendingUp',
    figure: 'statistical-distribution',
    summary:
      'Ajusta distribuições de probabilidade aos máximos anuais para estimar chuvas raras.',
    decision:
      'Escolha a distribuição que alimenta a curva IDF. O melhor ajuste já vem sugerido.',
    howItWorks: [
      'Extrai o máximo anual de intensidade por duração.',
      'Ajusta as distribuições candidatas aos dados.',
      'Compara cada ajuste ao histograma pelo [[SSE]].',
    ],
    interpret: {
      good: '[[SSE]] baixo e a curva acompanhando o histograma.',
      warning:
        '[[SSE]] parecido entre duas distribuições: prefira a de menos parâmetros.',
      problem: 'Curva distante das barras, sobretudo na cauda direita.',
    },
    glossary: {
      SSE: 'Soma dos quadrados dos erros entre a curva teórica e o histograma. Quanto menor, melhor o ajuste.',
    },
    references: [
      {
        citation:
          'Naghettini, M.; Pinto, E. J. A. Hidrologia estatística. CPRM, 2007.',
      },
    ],
    insight: (state: any) => {
      if (!state || !state.bestDistribution) return null;
      const sse =
        state.sse != null
          ? Number(state.sse).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : null;
      const count = state.candidateCount ?? 5;
      if (!sse) {
        return `${state.bestDistribution} é a distribuição com melhor ajuste.`;
      }
      return `${state.bestDistribution} teve o menor erro (SSE ${sse}) entre ${count} distribuições.`;
    },
  },
  'historical-idf': {
    id: 'historical-idf',
    title: 'IDF histórica',
    icon: 'lucideDroplets',
    figure: 'historical-idf',
    summary:
      'Gere as relações de intensidade, duração e frequência a partir dos parâmetros ajustados.',
  },
  'future-scenarios': {
    id: 'future-scenarios',
    title: 'Cenários futuros',
    icon: 'lucideSparkles',
    figure: 'future-scenarios',
    summary:
      'Projete alterações nas curvas IDF considerando modelos de circulação global e cenários climáticos.',
  },
};
