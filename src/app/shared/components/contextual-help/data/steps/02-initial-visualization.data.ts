import { HelpStepContent } from '../../../../../core/models/contextual-help.model';

export const INITIAL_VISUALIZATION_STEP_HELP: HelpStepContent = {
  id: 'initial-visualization',
  title: 'Visualização inicial',
  icon: 'lucideActivity',
  figure: 'initial-visualization',
  summary:
    'Inspecione a série histórica de precipitação, examine a distribuição temporal de falhas e avalie os máximos anuais registrados.',
  whyItMatters:
    'Permite diagnosticar a integridade da série temporal antes de qualquer processamento matemático. Identificar lacunas críticas evita que anos incompletos subestimem as chuvas máximas reais na modelagem.',
  decision:
    'Avalie se a série possui quantidade suficiente de anos consistentes para prosseguir na modelagem, ou exporte a série bruta em CSV para auditoria.',
  howItWorks: [
    'Alinha os registros a uma grade regular e calcula o total de observações, percentual de falhas e o pico histórico absoluto.',
    'Classifica a cobertura de cada ano: Completo (falhas ≤ 10%), Parcial (10% a 50%) e Falha severa (> 50%).',
    'Exibe os máximos anuais no gráfico superior e permite clicar em qualquer ano para inspecionar os hidrogramas diários ou horários.',
    'A fita de disponibilidade sintetiza a densidade e as lacunas dos dados ao longo de todo o período histórico.',
  ],
  interpret: {
    good: 'Falhas globais abaixo de 10% e mais de 15 a 20 anos classificados como Completos (falhas ≤ 10% no ano).',
    warning:
      'Anos com cobertura Parcial (10% a 50% de falhas), que exigirão preenchimento ou descarte na etapa de tratamento.',
    problem:
      'Período com ausência total de registros válidos ou menos de 5 anos com dados (inviabiliza o ajuste de curvas).',
  },
  references: [],
  insight: (state: any) => {
    if (!state || !state.stats) return null;
    const stats = state.stats;
    const valid = stats.valid_years ?? 0;
    const total = stats.total_years ?? 0;
    const failPct =
      stats.failure_percentage != null
        ? Number(stats.failure_percentage).toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })
        : null;

    if (valid > 0 && failPct !== null) {
      return `Série com ${valid} de ${total} anos completos e ${failPct}% de falhas globais registradas.`;
    }
    return null;
  },
};

