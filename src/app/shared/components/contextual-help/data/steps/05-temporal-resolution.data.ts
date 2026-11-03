import { HelpStepContent } from '../../../../../core/models/contextual-help.model';

export const TEMPORAL_RESOLUTION_STEP_HELP: HelpStepContent = {
  id: 'temporal-resolution',
  title: 'Resolução temporal',
  icon: 'lucideClock',
  figure: 'temporal-resolution',
  summary:
    'Obtenha as séries de precipitação máxima para durações de interesse por desagregação estatística ou agregação direta dos registros.',
  whyItMatters:
    'Projetos de drenagem urbana exigem intensidades em durações de minutos (5 min a 1 h), mas a maioria das estações do país registra apenas acumulados diários de 24 horas. A desagregação traduz volumes diários em intensidades sub-horárias com embasamento físico.',
  decision:
    'Para séries diárias ou horárias, escolha entre [[CETESB]] (coeficientes empíricos) ou [[Bartlett-Lewis]] (modelo estocástico calibrado). Para séries sub-horárias do CEMADEN, dispare a Agregação Direta.',
  howItWorks: [
    'Séries sub-horárias (CEMADEN): dispensa desagregação e agrega diretamente as medições de 10 min nas durações compatíveis (10 min até 24 h).',
    'Séries diárias via [[CETESB]]: aplica relações empíricas multiplicativas consagradas para obter os máximos anuais de 5 min a 24 h.',
    'Séries diárias via [[Bartlett-Lewis]]: calibra 5 parâmetros físicos estocásticos com base em uma estação CEMADEN próxima para simular o sinal sub-horário.',
    'Séries horárias (INMET): adota cálculo híbrido, utilizando medições reais para durações a partir de 1 h e desagregação para intervalos inferiores.',
  ],
  interpret: {
    good: 'Curva com decaimento monotônico da intensidade com a duração. No Bartlett-Lewis: calibração convergindo com estação representativa próxima.',
    warning:
      'Estação de calibração do Bartlett-Lewis situada a mais de 50–100 km da área de estudo, o que pode atenuar a representatividade local.',
    problem:
      'Estação de calibração com menos de 180 dias de registros válidos ou menos de 30 eventos de chuva (inviabiliza a parametrização do Bartlett-Lewis).',
  },
  references: [],
};

