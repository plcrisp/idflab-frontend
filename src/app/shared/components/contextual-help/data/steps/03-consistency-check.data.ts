import { HelpStepContent } from '../../../../../core/models/contextual-help.model';

export const CONSISTENCY_CHECK_STEP_HELP: HelpStepContent = {
  id: 'consistency-check',
  title: 'Verificação de consistência',
  icon: 'lucideShieldCheck',
  figure: 'consistency-check',
  summary:
    'Teste a homogeneidade e a estabilidade dos registros pluviométricos comparando os acumulados da estação com uma série vizinha de referência.',
  whyItMatters:
    'Mudanças no pluviômetro, crescimento de obstáculos ou falhas instrumentais criam alterações artificiais na série. A verificação garante que a tendência observada represente variações climáticas reais e não distorções da estação.',
  decision:
    'Escolha uma estação vizinha para confrontar as medições na [[Curva de Dupla Massa]] ou opte por avançar diretamente sem aplicar a verificação.',
  howItWorks: [
    'Busca estações vizinhas com resolução compatível em um raio primário de 100 km (expandindo se houver menos de 5 candidatas).',
    'Identifica os dias em que ambas as estações possuem registros válidos simultâneos (exige no mínimo 30 dias em comum).',
    'Gera a [[Curva de Dupla Massa]] confrontando a precipitação acumulada da vizinha (eixo X) com a principal (eixo Y) contra a linha 1:1.',
    'A verificação é opcional: você pode analisar uma ou mais vizinhas ou avançar direto com a série original.',
  ],
  interpret: {
    good: 'Curva retilínea com inclinação estável ao longo de todo o período, confirmando que a série é homogênea e livre de quebras estruturais.',
    warning:
      'Desvios suaves de inclinação em determinados anos, decorrentes de variabilidade climática regional ou microclima orográfico.',
    problem:
      'Mudança abrupta e contínua de inclinação (ponto de inflexão nítido), apontando alteração física no pluviômetro ou interferência no entorno.',
  },
  references: [],
};

