import { HelpStepContent } from '../../../../../core/models/contextual-help.model';

export const RESULTS_STEP_HELP: HelpStepContent = {
  id: 'results',
  title: 'Resultados',
  icon: 'lucideCheckCircle2',
  figure: 'results',
  summary:
    'Compare a equação IDF histórica com a projeção futura e avalie os acréscimos percentuais.',
  whyItMatters:
    'Esta é a entrega final de todo o estudo hidrológico. Confrontar diretamente os parâmetros e as curvas permite mensurar o impacto das mudanças climáticas.',
  howItWorks: [
    'Examine os parâmetros da Equação IDF. Veja os novos coeficientes K, m, n e t₀ projetados para o clima futuro lado a lado com os valores da série histórica.',
    'Analise as curvas comparativas. As linhas contínuas representam o histórico e as linhas tracejadas exibem a projeção futura para cada tempo de retorno ([[TR]]).',
    'Alterne a escala, filtre os tempos de retorno e consulte as matrizes. Use os modos Linear ou Log-log para analisar as curvas, selecione os TRs de interesse e alterne entre intensidade (mm/h) e [[Variação Percentual]].',
    'Exporte os resultados. Faça o download da planilha completa em CSV com todos os dados calculados.',
  ],
  interpret: {
    good: 'Ajuste futuro com [[R²]] ≥ 0,98, curvas futuras paralelas e sem cruzamento físico em relação às históricas, com acréscimos plausíveis entre 5% e 15%.',
    warning:
      'Incrementos superiores a 25% nas chuvas de curta duração (≤ 30 min) para tempos de retorno elevados ([[TR]] ≥ 50 anos).',
    problem:
      'Cruzes de curvas teóricas (linhas de TR maior abaixo de TR menor) ou [[R²]] < 0,90 na equação futura, sugerindo inconsistência na parametrização dos coeficientes K ou t₀.',
  },
};

