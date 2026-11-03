import { HelpStepContent } from '../../../../../core/models/contextual-help.model';

export const GAP_TREATMENT_STEP_HELP: HelpStepContent = {
  id: 'gap-treatment',
  title: 'Tratamento de falhas',
  icon: 'lucideFilter',
  figure: 'gap-treatment',
  summary:
    'Trate os períodos com dados ausentes na série pluviométrica optando entre a imputação estatística por aprendizado de máquina ou o descarte de anos incompletos.',
  whyItMatters:
    'Eventos extremos de chuva frequentemente coincidem com períodos de pane do sensor. O preenchimento recupera esses picos com base em estações vizinhas, enquanto a filtragem rigorosa descarta anos que poderiam subestimar o pico anual de chuva.',
  decision:
    'Defina entre Preencher falhas via [[Random Forest]] (usando uma estação vizinha correlacionada) ou Desconsiderar anos incompletos aplicando um limiar de completude anual.',
  howItWorks: [
    'Preenchimento via [[Random Forest]]: treina um modelo de regressão com as medições de uma estação vizinha e harmônicos de sazonalidade anual.',
    'Em séries horárias e CEMADEN, o modelo incorpora defasagens temporais (t-1, t, t+1) para rastrear o deslocamento espacial das chuvas.',
    'Filtragem por limiar: preserva estritamente dados observados e descarta anos com completude inferior ao patamar definido (padrão de 90% de dados válidos).',
    'Após a execução, o sistema exibe os novos anos completos conquistados e as métricas de validação do modelo ([[R²]], RMSE e MAE).',
  ],
  interpret: {
    good: 'No preenchimento: correlação de Pearson |r| ≥ 0,70 com sobreposição ≥ 10 anos e [[R²]] ≥ 0,75. No filtro: mais de 15 a 20 anos completos mantidos.',
    warning:
      'Correlação moderada (|r| entre 0,50 e 0,70), sobreposição curta (< 10 anos), lacunas contínuas superiores a 30 dias, ou corte excessivo de anos pelo filtro.',
    problem:
      'Correlação fraca (|r| < 0,50), ausência de período comum entre as estações, ou menos de 5 anos restantes após a filtragem.',
  },
  references: [],
};

