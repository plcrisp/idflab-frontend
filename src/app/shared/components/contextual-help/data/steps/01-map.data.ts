import { HelpStepContent } from '../../../../../core/models/contextual-help.model';

export const MAP_STEP_HELP: HelpStepContent = {
  id: 'map',
  title: 'Mapa',
  icon: 'lucideMap',
  figure: 'map',
  summary:
    'Escolha a estação e o período que vão alimentar toda a análise.',
  whyItMatters:
    'Todas as etapas subsequentes derivam desta escolha. Uma estação longe da bacia, ou com menos de 15-20 anos de dados, gera incertezas que se acumulam em todas as etapas seguintes.',
  howItWorks: [
    'Encontre sua estação. Navegue pelo mapa ou busque uma cidade. Você pode escolher entre: ANA (diária), INMET (horária/diária) ou CEMADEN (a cada 10 min).',
    'Defina o período. O sistema limita as datas ao que a estação oferece: do início da operação ao último dado recebido.',
    'Inicie a análise. Pronto: buscamos e organizamos os dados em segundo plano. Você pode seguir para a próxima etapa.',
  ],
  interpret: {
    good: 'Estação Operante e série contínua com mais de 20-30 anos.',
    warning:
      'Estação em Pane ou Falha no cadastro oficial, ou com menos de 15 anos de histórico. É possível utilizar, porém com cautela.',
    problem:
      'Período sem nenhuma medição registrada.',
  },
  references: [],
};

