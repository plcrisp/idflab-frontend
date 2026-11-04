import { HelpStepContent } from '../../../../../core/models/contextual-help.model';

export const INITIAL_VISUALIZATION_STEP_HELP: HelpStepContent = {
  id: 'initial-visualization',
  title: 'Visualização inicial',
  icon: 'lucideActivity',
  figure: 'initial-visualization',
  summary:
    'Confira se a série está completa e quando ocorreram as chuvas mais fortes.',
  whyItMatters:
    'Antes de qualquer cálculo, é preciso saber se os dados merecem confiança. Anos com muitas lacunas podem esconder as chuvas máximas reais e fazer a modelagem subestimar o risco.',
  howItWorks: [
    'Confira os totais. Os cards do topo mostram registros, % de falhas e o maior valor já registrado.',
    'Veja a cobertura de cada ano. Ele é classificado como Completo (até 10% de falhas), Parcial (10% a 50%) ou Falha severa (acima de 50%).',
    'Explore os máximos anuais. Clique em uma barra para ver o ano em detalhe, dia a dia ou hora a hora.',
    'Localize as lacunas. A fita de disponibilidade mostra, ano a ano, onde faltam dados.',
  ],
  interpret: {
    good: 'Falhas globais abaixo de 10% e mais de 15 a 20 anos Completos.',
    warning:
      'Anos Parciais (10% a 50% de falhas) exigem preenchimento ou descarte na etapa de tratamento.',
    problem:
      'Nenhum registro válido, ou menos de 5 anos com dados (inviabiliza o ajuste de curvas).',
  },
  references: [],
};

