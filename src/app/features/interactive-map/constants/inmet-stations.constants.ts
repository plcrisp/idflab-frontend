export interface InmetStationSummary {
  id: string;
  code: string;
  name: string;
  type: string;
}

export const INMET_AVAILABLE_STATIONS: InmetStationSummary[] = [
  { id: 'bac388d3-deba-4682-81e7-07d03faa020d', code: '83781', name: 'São Paulo (Mir. de Santana)', type: 'Convencional' },
  { id: '5d674c28-10a3-4298-bef6-872d8a637b13', code: 'A701', name: 'São Paulo (Mirante)', type: 'Automática' },
  { id: '150df017-34fb-4e9c-bf6c-0c64475c3e77', code: 'A711', name: 'São Carlos', type: 'Automática' },
  { id: 'e30e1c61-9a37-4955-aa2a-c96e73e78d37', code: 'A728', name: 'Taubaté', type: 'Automática' },
];

const INMET_AVAILABLE_CODES = new Set(INMET_AVAILABLE_STATIONS.map((s) => s.code.toUpperCase()));
const INMET_AVAILABLE_IDS = new Set(INMET_AVAILABLE_STATIONS.map((s) => s.id.toLowerCase()));

export function hasInmetData(
  station: { source?: string; code?: string; id?: string } | null | undefined,
): boolean {
  if (!station || station.source !== 'INMET') return false;
  const codeMatch = station.code ? INMET_AVAILABLE_CODES.has(station.code.toUpperCase()) : false;
  const idMatch = station.id ? INMET_AVAILABLE_IDS.has(station.id.toLowerCase()) : false;
  return codeMatch || idMatch;
}
