import { StationSummary } from './station.model';

export type StepEnum =
  | 'INITIAL_VISUALIZATION'
  | 'CONSISTENCY'
  | 'GAP_FILLING'
  | 'TEMPORAL_RESOLUTION'
  | 'DISTRIBUTION'
  | 'HISTORICAL_IDF'
  | 'FUTURE_SCENARIOS'
  | 'RESULTS';

export interface Project {
  id: string;
  user_id: string;
  station_id?: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  furthest_step: StepEnum;

  station: StationSummary;
}

export type ProjectResponse = Project;


export interface ProjectCreateRequest {
  station_id: string;
  name: string;
  start_date: string;
  end_date: string;
}

export interface ProjectCreateResponse {
  status: string;
  project_id: string;
  message?: string | null;
  job_id?: string | null;
}

export interface SidebarProject {
  id: string;
  station_name: string;
  created_at: string;
}

export interface SidebarState {
  loading: boolean;
  projects: SidebarProject[];
}
