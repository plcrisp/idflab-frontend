export type StationSource = 'INMET' | 'CEMADEN';

export type StationTypeEnum =
  | 'Acqua'
  | 'Pluviométrica'
  | 'Agrometeorológica'
  | 'Geotécnica'
  | 'Hidrológica'
  | 'Automática'
  | 'Convencional';

export interface Station {
  id: string;
  code: string;
  source: StationSource;
  name: string;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  status: string | null;

  operation_start_date: string | null;
  last_data_date: string | null;

  station_type: StationTypeEnum;
}

export interface StationBBoxRequest {
  min_lat: number;
  max_lat: number;
  min_lon: number;
  max_lon: number;
  sources: StationSource[];
}

export interface Marker {
  id: string;
  latitude: number;
  longitude: number;
  source: StationSource;
  status: string;
  state: string;
  name: string;
  city: string | undefined;
}

export interface SidebarDashboardStats {
  totalStations: number;
  activePercentage: number;
  inmetCount: number;
  cemadenCount: number;
  inmetActivePercentage: number;
  cemadenActivePercentage: number;
}

export interface SearchResult {
  marker: Marker;
  label: string;
  sublabel: string;
}
