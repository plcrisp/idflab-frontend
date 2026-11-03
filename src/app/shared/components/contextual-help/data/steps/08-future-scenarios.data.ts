import { HelpStepContent } from '../../../../../core/models/contextual-help.model';

export const FUTURE_SCENARIOS_STEP_HELP: HelpStepContent = {
  id: 'future-scenarios',
  title: 'Cenários futuros',
  icon: 'lucideSparkles',
  figure: 'future-scenarios',
  summary:
    'Projete alterações nas curvas IDF até 2100 considerando projeções climáticas e modelos de circulação global sob diferentes cenários de emissão.',
  whyItMatters:
    'As curvas convencionais assumem que o clima é estacionário. Incorporar projeções climáticas (CMIP6/CLIMBra) evita que obras projetadas hoje fiquem subdimensionadas e vulneráveis diante do aumento de extremos pluviométricos até 2100.',
  decision:
    'Avalie o impacto das mudanças climáticas sobre a segurança das obras hidráulicas. Esta funcionalidade está atualmente em fase de desenvolvimento.',
  howItWorks: [
    'Etapa em desenvolvimento ativo: integrará em breve a base de dados do projeto [[CLIMBra]] (modelos climáticos do CMIP6/IPCC regionalizados pelo INPE).',
    'Permitirá selecionar horizontes temporais futuros (2030–2060 e 2070–2100) sob trajetórias socioeconômicas [[SSP]] intermediárias (SSP2-4.5) e severas (SSP5-8.5).',
    'Utilizará métodos de correção de viés estatístico (como Quantile Mapping) para harmonizar as saídas dos modelos climáticos com a série histórica local.',
    'Derivará fatores de escala para recalcular os 4 parâmetros da [[Equação IDF]], contemplando a não-estacionariedade do clima nas curvas de projeto.',
  ],
  interpret: {
    good: 'Variação climática projetada inferior a 5% na intensidade de precipitação para o tempo de retorno e horizonte da obra.',
    warning:
      'Incremento projetado entre 10% e 25% nas chuvas extremas ([[TR]] ≥ 25 anos), demandando coeficientes de segurança na drenagem.',
    problem:
      'Acréscimos projetados superiores a 30% no cenário SSP5-8.5, sinalizando severa vulnerabilidade caso a obra seja dimensionada apenas pelo histórico estacionário.',
  },
  references: [],
};

