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
