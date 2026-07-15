import { StationSummary } from './station.model';

export interface Project {
  id: string;
  user_id: string;
  station_id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;

  station: StationSummary;
}

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
