import { HelpStepContent } from '../../../../../core/models/contextual-help.model';

export const CONSISTENCY_CHECK_STEP_HELP: HelpStepContent = {
  id: 'consistency-check',
  title: 'Verificação de consistência',
  icon: 'lucideShieldCheck',
  figure: 'consistency-check',
  summary:
    'Compare a estação principal com uma vizinha para confirmar que a série não tem distorções.',
  whyItMatters:
    'Troca de equipamento, obstáculos novos ao redor ou falhas do instrumento criam mudanças artificiais na série. A verificação garante que a tendência observada reflita o clima de verdade, e não problemas da estação.',
  howItWorks: [
    'Escolha uma estação vizinha. O sistema lista as candidatas com resolução compatível, em um raio de 100 km (ampliado se houver menos de 5).',
    'Confira o período em comum. Só entram os dias em que as duas estações têm registro válido, com mínimo de 30 dias.',
    'Leia a [[Curva de Dupla Massa]]. O gráfico compara a chuva acumulada da vizinha (eixo X) com a da principal (eixo Y) e traça a linha ideal 1:1 como referência.',
    'Teste outras vizinhas ou avance. A verificação é opcional: analise uma ou mais estações, ou siga direto com a série original.',
  ],
  interpret: {
    good: 'Curva retilínea com inclinação estável ao longo de todo o período, confirmando que a série é homogênea e livre de quebras estruturais.',
    warning:
      'Desvios suaves de inclinação em alguns anos. Costumam vir de variabilidade climática regional ou microclima.',
    problem:
      'Mudança brusca e contínua de inclinação (ponto de inflexão nítido). Indica alteração física no pluviômetro ou interferência no entorno.',
  },
  references: [],
};

