import { HelpStepContent } from '../../../../../core/models/contextual-help.model';

export const MAP_STEP_HELP: HelpStepContent = {
  id: 'map',
  title: 'Mapa',
  icon: 'lucideMap',
  figure: 'map',
  summary:
    'Localize e selecione a estação pluviométrica de interesse e defina a janela temporal histórica para iniciar a aquisição dos dados brutos.',
  whyItMatters:
    'A representatividade espacial e a extensão temporal definem a qualidade de todo o estudo. Selecionar uma estação distante da bacia ou com histórico inferior a 15–20 anos introduz incertezas que se propagam por todas as etapas seguintes.',
  decision:
    'Escolha a estação com a melhor cobertura espacial para a sua bacia hidrográfica e defina as datas inicial e final do histórico de chuva.',
  howItWorks: [
    'Filtre estações no mapa ou na busca textual entre as redes oficiais da ANA (diária), INMET (horária/diária) e CEMADEN (sub-horária 10 min).',
    'Defina a janela temporal respeitando os limites da estação: data mínima a partir do início de operação e máxima até o último dado telemétrico.',
    'Ao iniciar a análise, um job em segundo plano baixa e consolida os registros brutos da estação no banco de dados.',
  ],
  interpret: {
    good: 'Estação com status cadastral Operante e série histórica contínua superior a 20 ou 30 anos.',
    warning:
      'Estação com status de Pane ou Falha no cadastro oficial, ou período histórico inferior a 15 anos.',
    problem:
      'Data inicial posterior à final (bloqueia o formulário) ou intervalo sem nenhuma medição registrada no provedor.',
  },
  references: [],
};

