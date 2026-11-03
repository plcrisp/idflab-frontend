import { HelpStepContent } from '../../../../../core/models/contextual-help.model';

export const STATISTICAL_DISTRIBUTION_STEP_HELP: HelpStepContent = {
  id: 'statistical-distribution',
  title: 'Distribuição estatística',
  icon: 'lucideTrendingUp',
  figure: 'statistical-distribution',
  summary:
    'Ajuste distribuições teóricas de probabilidade às séries de máximos anuais para estimar precipitações associadas a tempos de retorno raros.',
  whyItMatters:
    'Obras hidráulicas são dimensionadas para tempos de retorno raros (ex.: 25, 50 ou 100 anos), que vão além da amostra observada. O ajuste probabilístico permite extrapolar a curva com rigor matemático e selecionar o modelo de menor incerteza.',
  decision:
    'Escolha a distribuição de probabilidade que irá alimentar as curvas IDF. O IDFLab sugere o modelo com melhor qualidade de ajuste pelo critério do [[SSE]].',
  howItWorks: [
    'Extrai as intensidades máximas anuais para cada uma das durações de chuva processadas na etapa anterior.',
    'Gera o histograma empírico de frequências utilizando a regra de [[Doane]], adequada para amostras com forte assimetria positiva.',
    'Ajusta 5 modelos clássicos: [[Gumbel]] (2 parâmetros), [[GEV]] (3p), [[Log-Normal]] (3p), [[GLO]] (3p) e [[Pearson Tipo III]] (3p).',
    'Classifica o ajuste de cada distribuição pelo [[SSE]] médio e calcula as chuvas de projeto para [[TR]] de 10, 50 e 100 anos.',
  ],
  interpret: {
    good: 'Menor [[SSE]] e curva teórica ajustando-se com fidelidade ao histograma, sobretudo no decaimento da cauda direita.',
    warning:
      'Modelos com [[SSE]] semelhante: priorize a formulação mais parcimoniosa ([[Gumbel]], 2p). Séries com menos de 20 anos exigem cautela com modelos de 3 parâmetros.',
    problem:
      'Curva teórica deslocada das barras de frequência ou estimativas físicas discrepantes para tempos de retorno elevados.',
  },
  references: [],
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
    return `${state.bestDistribution} obteve o menor erro médio (SSE ${sse}) entre as ${count} distribuições avaliadas.`;
  },
};

