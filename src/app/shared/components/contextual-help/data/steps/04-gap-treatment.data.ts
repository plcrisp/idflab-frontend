import { HelpStepContent } from '../../../../../core/models/contextual-help.model';

export const GAP_TREATMENT_STEP_HELP: HelpStepContent = {
  id: 'gap-treatment',
  title: 'Tratamento de falhas',
  icon: 'lucideFilter',
  figure: 'gap-treatment',
  summary:
    'Preencha as lacunas da série com uma estação vizinha ou descarte os anos incompletos.',
  whyItMatters:
    'As chuvas mais extremas costumam coincidir com panes do sensor. O preenchimento recupera esses picos usando estações vizinhas, e a filtragem descarta anos que poderiam subestimar o máximo anual.',
  howItWorks: [
    'Escolha o método. Preencher falhas estima os valores ausentes; Desconsiderar anos incompletos usa só dados observados.',
    'Selecione a estação vizinha. No preenchimento, o sistema treina um modelo [[Random Forest]] com as medições dela e a sazonalidade anual.',
    'Deixe o sistema cuidar do detalhe temporal. Em séries horárias e CEMADEN, o modelo inclui defasagens (t-1, t, t+1) para acompanhar o deslocamento das chuvas.',
    'Ajuste o limiar, se filtrar. Anos abaixo do patamar (padrão: 90% de dados válidos) são descartados.',
    'Confira o resultado. O sistema mostra os novos anos completos e as métricas de validação do modelo ([[R²]], RMSE e MAE).',
  ],
  interpret: {
    good: 'No preenchimento, correlação |r| ≥ 0,70, sobreposição ≥ 10 anos e [[R²]] ≥ 0,75. No filtro, mais de 15 a 20 anos completos mantidos.',
    warning:
      'Correlação moderada (|r| entre 0,50 e 0,70), sobreposição curta (< 10 anos), lacunas contínuas acima de 30 dias ou corte excessivo de anos pelo filtro.',
    problem:
      'Correlação fraca (|r| < 0,50), nenhum período em comum entre as estações ou menos de 5 anos restantes após a filtragem.',
  },
  references: [],
};

