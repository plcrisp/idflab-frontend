export const GLOBAL_GLOSSARY: Record<string, string> = {
  SSE: 'Soma dos Quadrados dos Erros entre a curva teórica ajustada e o histograma empírico. Quanto menor o valor, melhor a fidelidade do ajuste.',
  Doane:
    'Regra estatística para definição da quantidade de classes no histograma, ideal para séries assimétricas de chuvas extremas.',
  'Curva de Dupla Massa':
    'Método gráfico que confronta acumulados de precipitação entre duas estações. Uma reta contínua indica série homogênea; quebras de inclinação apontam falhas instrumentais ou alterações de local.',
  'Dupla Massa':
    'Método gráfico que confronta acumulados de precipitação entre duas estações. Uma reta contínua indica série homogênea; quebras de inclinação apontam falhas instrumentais ou alterações de local.',
  'Random Forest':
    'Algoritmo de aprendizado de máquina por conjunto de árvores de decisão. No IDFLab, estima dados ausentes combinando a estação vizinha com sazonalidade e defasagens temporais.',
  CETESB:
    'Relações empíricas desenvolvidas a partir de dados de chuva do estado de São Paulo (DAEE/CETESB) para converter chuvas diárias em durações menores, de 5 min a 24 h. Rápido, mas calibrado para a realidade paulista.',
  'Hyetos-Minute Bartlett-Lewis':
    'Modelo estocástico (Hyetos-Minute) que simula a estrutura das tempestades em escala sub-horária, a partir de parâmetros calibrados em uma estação de alta resolução próxima.',
  'Bartlett-Lewis':
    'Modelo estocástico (Hyetos-Minute) que simula a estrutura das tempestades em escala sub-horária, a partir de parâmetros calibrados em uma estação de alta resolução próxima.',
  Gumbel:
    'Distribuição de extremos Tipo I com 2 parâmetros (posição e escala). Modelo clássico e parcimonioso mais utilizado em obras de drenagem.',
  GEV: 'Distribuição Generalizada de Valores Extremos com 3 parâmetros (posição, escala e forma). Modelo de referência na hidrologia moderna.',
  'Log-Normal':
    'Distribuição com 3 parâmetros em que os logaritmos dos dados seguem uma distribuição normal deslocada por um parâmetro de origem.',
  'Pearson Tipo III':
    'Distribuição probabilística com 3 parâmetros (gama deslocada), consagrada em diretrizes internacionais para estimativa de cheias.',
  GLO: 'Distribuição Logística Generalizada com 3 parâmetros, amplamente aplicada na análise regional de frequência de inundações.',
  'Tempo de Retorno':
    'Intervalo médio de anos em que se espera que uma precipitação de dada intensidade seja igualada ou superada ao menos uma vez.',
  TR: 'Tempo de Retorno: intervalo médio de anos em que se espera que uma intensidade de chuva seja igualada ou superada ao menos uma vez.',
  CLIMBra:
    'Projeções climáticas regionalizadas para o Brasil baseadas no CMIP6 / IPCC AR6, desenvolvidas pelo INPE para análise de cenários futuros.',
  SSP: 'Shared Socioeconomic Pathways: cenários do IPCC que projetam emissões e aquecimento global até 2100 (ex.: SSP2-4.5 intermediário e SSP5-8.5 extremo).',
  'Equação IDF':
    'Relação paramétrica clássica i = K · TRᵐ / (d + t₀)ⁿ que relaciona intensidade (i), duração (d) e tempo de retorno (TR).',
  'R²': 'Coeficiente de determinação da regressão não linear. Quanto mais próximo de 1, melhor a equação explica a variabilidade observada.',
};

