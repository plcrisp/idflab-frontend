import { HelpStepContent } from '../../../../../core/models/contextual-help.model';

export const STATISTICAL_DISTRIBUTION_STEP_HELP: HelpStepContent = {
  id: 'statistical-distribution',
  title: 'Distribuição estatística',
  icon: 'lucideTrendingUp',
  figure: 'statistical-distribution',
  summary:
    'Escolha a distribuição que melhor representa seus máximos anuais para estimar chuvas de tempos de retorno raros.',
  whyItMatters:
    'Obras hidráulicas são dimensionadas para tempos de retorno raros (25, 50 ou 100 anos), que vão além do período observado. O ajuste probabilístico permite extrapolar com rigor e escolher o modelo de menor incerteza.',
  howItWorks: [
    'Visualize cada duração. O gráfico de barras mostra as intensidades máximas anuais da duração selecionada, vindas da etapa anterior.',
    'Compare as distribuições. O sistema ajusta [[Gumbel]], [[GEV]], [[Log-Normal]], [[GLO]] e [[Pearson Tipo III]] e as ordena pelo [[SSE]]. A de menor erro recebe o selo “Melhor ajuste”.',
    'Selecione a distribuição. Confira se a curva acompanha o histograma, principalmente na cauda direita. Use o ícone de info para ver as intensidades por [[TR]].',
    'Avance com a escolhida. Ela alimenta o cálculo das chuvas de projeto para [[TR]] grandes.',
  ],
  interpret: {
    good: 'Menor [[SSE]] e curva teórica ajustada ao histograma, sobretudo na cauda direita.',
    warning:
      'Modelos com [[SSE]] parecido: prefira o mais simples ([[Gumbel]], 2p). Séries com menos de 20 anos pedem cautela com modelos de 3 parâmetros.',
    problem:
      'Curva teórica deslocada das barras ou estimativas físicas discrepantes para tempos de retorno elevados.',
  },
  references: [],
};

