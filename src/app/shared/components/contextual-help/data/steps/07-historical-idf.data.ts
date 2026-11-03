import { HelpStepContent } from '../../../../../core/models/contextual-help.model';

export const HISTORICAL_IDF_STEP_HELP: HelpStepContent = {
  id: 'historical-idf',
  title: 'IDF histórica',
  icon: 'lucideDroplets',
  figure: 'historical-idf',
  summary:
    'Gere a equação matemática e a família de curvas IDF calibradas para diferentes tempos de retorno a partir da distribuição estatística selecionada.',
  whyItMatters:
    'Sintetiza todo o regime de chuvas intensas da localidade em uma única equação matemática universal. É essa fórmula que engenheiros utilizam para dimensionar canais, bueiros, galerias pluviais e bacias de amortecimento.',
  decision:
    'Valide a aderência da [[Equação IDF]] aos quantis estatísticos observando o coeficiente [[R²]], o erro máximo e o comportamento das curvas nas escalas linear e logarítmica.',
  howItWorks: [
    'Ajusta por otimização não linear a [[Equação IDF]] clássica: i = K · TRᵐ / (d + t₀)ⁿ aos quantis da distribuição selecionada.',
    'Determina os 4 parâmetros: K (localidade), m (sensibilidade ao retorno), n (decaimento temporal) e t₀ (constante de ajuste em minutos).',
    'Gera curvas contínuas para [[TR]] de 2, 5, 10, 25, 50 e 100 anos, permitindo alternar entre visualização Linear e Log-log.',
    'Permite inspecionar a matriz de Intensidades calculadas (mm/h) e a matriz de Erros percentuais relativos em cada duração.',
  ],
  interpret: {
    good: 'Coeficiente [[R²]] ≥ 0,98, curvas estritamente paralelas na visualização Log-log e resíduos percentuais inferiores a ±10%.',
    warning:
      'Parâmetro t₀ atingindo o limite numérico (0,1 ou 30 min com badge de aviso) ou resíduos entre 10% e 20% em durações inferiores a 10 min.',
    problem:
      'Coeficiente [[R²]] < 0,90 ou inversão na ordenação das curvas (chuvas de maior retorno com intensidade inferior, o que viola a física do modelo).',
  },
  references: [],
};

