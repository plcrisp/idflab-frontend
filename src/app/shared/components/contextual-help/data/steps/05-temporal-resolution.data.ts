import { HelpStepContent } from '../../../../../core/models/contextual-help.model';

export const TEMPORAL_RESOLUTION_STEP_HELP: HelpStepContent = {
  id: 'temporal-resolution',
  title: 'Resolução temporal',
  icon: 'lucideClock',
  figure: 'temporal-resolution',
  summary:
    'Gere as séries de chuva máxima para durações curtas (5 min a 24 h) a partir dos dados disponíveis.',
  whyItMatters:
    'Projetos de drenagem urbana precisam de intensidades em minutos, mas a maioria das estações do país só registra o acumulado diário. A desagregação converte volumes diários em intensidades sub-horárias com base física.',
  howItWorks: [
    'Veja o método da sua série. O sistema sugere o caminho conforme a resolução dos dados. Séries sub-horárias (CEMADEN) dispensam configuração, e as horárias (INMET) usam cálculo híbrido.',
    'Em séries diárias, escolha entre [[CETESB]] e [[Hyetos-Minute Bartlett-Lewis]]. O primeiro é o caminho rápido; o segundo é mais preciso e usa uma estação CEMADEN próxima.',
    'Selecione a estação de calibração e confira o resultado. Veja a curva de decaimento ou a tabela anual.',
  ],
  interpret: {
    good: 'Curva com intensidade decrescente conforme a duração aumenta. No [[Hyetos-Minute Bartlett-Lewis]], calibração com estação próxima e representativa.',
    warning:
      'Estação de calibração a mais de 50 a 100 km da área de estudo, o que pode reduzir a representatividade local.',
    problem:
      'Estação de calibração com menos de 180 dias de registros válidos ou menos de 30 eventos de chuva (inviabiliza a parametrização).',
  },
  references: [],
};

