import { StepEnum } from './project.model';

export type StepStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface ConsistencyStepParams {
  neighbor_station_id?: string | null;
  excluded_years?: number[];
}

export interface ProjectStepSaveRequest<T = Record<string, any>> {
  step: StepEnum;
  status?: StepStatus;
  params: T;
  result?: Record<string, any> | null;
  job_id?: string | null;
}

export interface ProjectStepResponse<T = Record<string, any>> {
  id: string;
  project_id: string;
  step: StepEnum;
  status: StepStatus;
  params: T;
  result: Record<string, any> | null;
  job_id: string | null;
  updated_at: string;
}
