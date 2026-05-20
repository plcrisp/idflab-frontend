export type StationSource = 'INMET' | 'CEMADEN';

export interface Station {
  id: string;
  code: string;
  source: StationSource;
  name: string;
  city?: string | null;
  state?: string | null;
  latitude: number;
  longitude: number;
  status: string;
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
}

export interface SidebarDashboardStats {
  regionName: string;
  totalStations: number;
  activePercentage: number;
  inmetCount: number;
  cemadenCount: number;
}
