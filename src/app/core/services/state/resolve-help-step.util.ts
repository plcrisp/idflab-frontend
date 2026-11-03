import { HelpStepId } from '../../models/contextual-help.model';

/**
 * Pure function to map a route URL to a contextual help step.
 * Returns null for routes outside the 8-step analysis flow (e.g. interactive-map, projects, dashboard).
 */
export function resolveHelpStep(url: string | null | undefined): HelpStepId | null {
  if (!url) return null;
  const cleanUrl = url.toLowerCase().split('?')[0].split('#')[0].trim();

  if (!cleanUrl) return null;

  // Explicit non-step routes
  if (
    cleanUrl === '/app/interactive-map' ||
    cleanUrl === '/interactive-map' ||
    cleanUrl.startsWith('/app/projects') ||
    cleanUrl.startsWith('/projects') ||
    cleanUrl.startsWith('/app/dashboard') ||
    cleanUrl.startsWith('/dashboard') ||
    cleanUrl.startsWith('/app/projetos') ||
    cleanUrl.startsWith('/projetos') ||
    cleanUrl.startsWith('/auth') ||
    cleanUrl.startsWith('/profile') ||
    cleanUrl.startsWith('/perfil') ||
    cleanUrl.startsWith('/settings') ||
    cleanUrl.startsWith('/configuracoes')
  ) {
    return null;
  }

  // 1. Map step (only when inside the analysis flow / project context)
  if (
    (cleanUrl.includes('/analysis/') || cleanUrl.includes('/analise/')) &&
    (cleanUrl.includes('/interactive-map') ||
      cleanUrl.includes('/mapa') ||
      cleanUrl.endsWith('/map') ||
      cleanUrl.includes('/map/'))
  ) {
    return 'map';
  }
  if (cleanUrl === '/map' || cleanUrl === 'map') {
    return 'map';
  }

  // 2. Consistency check
  if (cleanUrl.includes('consistency-check') || cleanUrl.includes('consistency')) {
    return 'consistency-check';
  }

  // 3. Gap treatment
  if (
    cleanUrl.includes('gap-filling') ||
    cleanUrl.includes('tratamento-de-falhas') ||
    cleanUrl.includes('gap-treatment')
  ) {
    return 'gap-treatment';
  }

  // 4. Temporal resolution
  if (
    cleanUrl.includes('temporal-disaggregation') ||
    cleanUrl.includes('temporal-resolution') ||
    cleanUrl.includes('resolucao-temporal')
  ) {
    return 'temporal-resolution';
  }

  // 5. Statistical distribution
  if (
    cleanUrl.includes('statistical-distribution') ||
    cleanUrl.includes('distribuicao-estatistica') ||
    cleanUrl.includes('distribution')
  ) {
    return 'statistical-distribution';
  }

  // 6. Historical IDF
  if (cleanUrl.includes('historical-idf') || cleanUrl.includes('idf-historica')) {
    return 'historical-idf';
  }

  // 7. Future scenarios
  if (
    cleanUrl.includes('cenarios-futuros') ||
    cleanUrl.includes('future-scenarios') ||
    cleanUrl.includes('resultados') ||
    cleanUrl.includes('results')
  ) {
    return 'future-scenarios';
  }

  // 8. Initial visualization (also default page for /analysis/:projectId)
  if (
    cleanUrl.includes('initial-view') ||
    cleanUrl.includes('initial-visualization') ||
    cleanUrl.includes('/analysis/') ||
    cleanUrl.includes('/analise/')
  ) {
    return 'initial-visualization';
  }

  return null;
}

