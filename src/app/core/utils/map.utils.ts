export const CLUSTER_SOURCE = 'stations-cluster';
export const CLUSTER_LAYERS_IDS = ['unclustered-point', 'cluster-count', 'clusters'];

export const MAP_COLORS = {
  inmet: '#49628b',
  cemaden: '#0891b2',
  warning: '#f59e0b',
  border: '#ffffff',
  shadow: 'rgba(0,0,0,0.15)',
};

export const getClusterSourceConfig = (geojson: any) => ({
  type: 'geojson',
  data: geojson,
  cluster: true,
  clusterMaxZoom: 9,
  clusterRadius: 60,
});

export const CLUSTER_LAYER = {
  id: 'clusters',
  type: 'circle',
  source: CLUSTER_SOURCE,
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': ['step', ['get', 'point_count'], '#49628b', 50, '#2a3c58', 500, '#1e2a3f'],
    'circle-radius': ['step', ['get', 'point_count'], 14, 50, 18, 500, 24],
    'circle-opacity': 0.9,
    'circle-stroke-width': 1.5,
    'circle-stroke-color': 'rgba(242, 242, 242, 0.4)',
  },
};

export const CLUSTER_COUNT_LAYER = {
  id: 'cluster-count',
  type: 'symbol',
  source: CLUSTER_SOURCE,
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-size': 12,
    'text-font': ['Inter Regular', 'Open Sans Regular', 'Arial Unicode MS Regular'],
  },
  paint: {
    'text-color': '#f2f2f2',
  },
};

export const UNCLUSTERED_POINT_LAYER = {
  id: 'unclustered-point',
  type: 'symbol',
  source: CLUSTER_SOURCE,
  filter: ['!', ['has', 'point_count']],
  layout: {
    'icon-image': [
      'concat',
      ['match', ['get', 'status'], 'Pane', 'icon-pane-', 'icon-operante-'],
      ['match', ['get', 'source'], 'INMET', 'inmet', 'cemaden'],
    ],
    'icon-size': 1,
    'icon-allow-overlap': true,
  },
};

export const MAP_ICONS: Record<string, string> = {
  'icon-operante-cemaden': `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="7" fill="${MAP_COLORS.cemaden}" stroke="${MAP_COLORS.border}" stroke-width="2.5" />
    </svg>`,
  'icon-operante-inmet': `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <rect x="5" y="5" width="14" height="14" rx="3" fill="${MAP_COLORS.inmet}" stroke="${MAP_COLORS.border}" stroke-width="2.5" />
    </svg>`,
  'icon-pane-cemaden': `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="7" fill="${MAP_COLORS.cemaden}" stroke="${MAP_COLORS.border}" stroke-width="2.5" />
      <circle cx="18" cy="6" r="4.5" fill="${MAP_COLORS.warning}" stroke="${MAP_COLORS.border}" stroke-width="1.5" />
      <text x="18" y="8" text-anchor="middle" font-size="6" font-weight="bold" fill="white" font-family="Arial">!</text>
    </svg>`,
  'icon-pane-inmet': `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <rect x="5" y="5" width="14" height="14" rx="3" fill="${MAP_COLORS.inmet}" stroke="${MAP_COLORS.border}" stroke-width="2.5" />
      <circle cx="18" cy="6" r="4.5" fill="${MAP_COLORS.warning}" stroke="${MAP_COLORS.border}" stroke-width="1.5" />
      <text x="18" y="8" text-anchor="middle" font-size="6" font-weight="bold" fill="white" font-family="Arial">!</text>
    </svg>`,
};

export const getHoverPopupHtml = (props: any, regionText: string): string => {
  const statusClass = (props['status'] || 'desconhecido').toLowerCase();
  const nameLower = props['name'] ? props['name'].toLowerCase() : '';
  const sourceClass = props['source'] ? props['source'].toLowerCase() : '';

  return `
    <div class="hover-content">
      <div class="hover-header">
        <span class="hover-region">${regionText}</span>
        <div class="hover-dot ${statusClass}"></div>
      </div>
      <div class="hover-name">${nameLower}</div>
      <div class="hover-divider"></div>
      <div class="hover-footer">
        <div class="hover-badge ${sourceClass}">
          ${props['source']}
        </div>
      </div>
    </div>
  `;
};
