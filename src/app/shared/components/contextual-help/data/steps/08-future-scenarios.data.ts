import { HelpStepContent } from '../../../../../core/models/contextual-help.model';

export const FUTURE_SCENARIOS_STEP_HELP: HelpStepContent = {
  id: 'future-scenarios',
  title: 'Cenários futuros',
  icon: 'lucideSparkles',
  figure: 'future-scenarios',
  summary:
    'Calibre projeções climáticas do [[CLIMBra]] com a série da sua estação e corrija os vieses dos modelos para horizontes até 2100.',
  whyItMatters:
    'A engenharia tradicional assume que as chuvas históricas se repetirão no futuro (hipótese de clima estacionário). Em tempos de mudanças climáticas, projetar galerias, barragens e canais apenas pelo histórico pode levar ao subdimensionamento das estruturas e a falhas hidráulicas prematuras.',
  howItWorks: [
    'Escolha o método de correção de viés. Selecione entre [[EQM]], [[QM]] ou [[DBC]]. Eles ajustam a distribuição teórica simulada aos dados reais da estação.',
    'Defina o modelo e o cenário de emissão. Escolha o modelo global do CMIP6 e o cenário socioeconômico ([[SSP2-4.5]] ou [[SSP5-8.5]]).',
    'Ajuste o horizonte temporal. Defina o ano de início e o ano de fim de sua projeção.',
    'Avalie as células e a janela de calibração. O sistema localiza as células do [[CLIMBra]] em um raio de 25 km e pareia os dados com o histórico observado na janela de referência (1980-2013).',
    'Confira a remoção de viés nos cards. Verifique a convergência entre a média observada e a média do modelo corrigido.',
  ],
  interpret: {
    good: 'Modelo corrigido com desvio médio inferior a 5% em relação ao observado histórico na janela de referência.',
    warning:
      'Diferença substancial (> 25%) entre o modelo bruto e a estação na janela de referência. O método de correção atuará com maior intensidade para harmonizar os quantis.',
    problem:
      'Estação sem sobreposição temporal mínima de 10 anos na janela 1980-2013 (típico de estações CEMADEN recentes) ou coordenadas fora da cobertura da malha do CLIMBra.',
  },
};
  