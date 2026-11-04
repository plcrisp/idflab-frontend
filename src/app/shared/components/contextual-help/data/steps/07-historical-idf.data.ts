import { HelpStepContent } from '../../../../../core/models/contextual-help.model';

export const HISTORICAL_IDF_STEP_HELP: HelpStepContent = {
  id: 'historical-idf',
  title: 'IDF histórica',
  icon: 'lucideDroplets',
  figure: 'historical-idf',
  summary:
    'Obtenha a [[Equação IDF]] e as curvas para diferentes tempos de retorno, calibradas com a distribuição escolhida.',
  whyItMatters:
    'Toda a análise de chuvas intensas da localidade é resumida em uma única equação. É ela que engenheiros usam para dimensionar canais, bueiros, galerias pluviais e bacias de amortecimento.',
  howItWorks: [
    'Confira a [[Equação IDF]]. O sistema ajusta os parâmetros K, m, n e t₀ aos valores da distribuição selecionada. Eles aparecem nos cards acima do gráfico.',
    'Explore as curvas. O gráfico mostra uma curva para cada [[TR]] (2, 5, 10, 25, 50 e 100 anos). Alterne entre Linear e Log-log para enxergar melhor as diferenças.',
    'Verifique a qualidade do ajuste. Veja o [[R²]] no título do gráfico e use as abas Intensidade e Erro para inspecionar os valores e os desvios em cada duração.',
    'Avance com a equação. Ela segue para a etapa de cenários futuros.',
  ],
  interpret: {
    good: '[[R²]] ≥ 0,98, curvas paralelas no Log-log e erros percentuais abaixo de ±10%.',
    warning:
      't₀ no limite numérico (0,1 ou 30 min, com selo de aviso) ou erros entre 10% e 20% em durações abaixo de 10 min.',
    problem:
      '[[R²]] < 0,90 ou curvas cruzadas ([[TR]] maior com intensidade menor, o que viola a física do modelo).',
  },
  references: [],
};

