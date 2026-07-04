// core/models/job.model.ts
export type TaskType =
  | 'DOWNLOAD_STATION_DATA'
  | 'GAP_FILLING'
  | 'QUALITY_ANALYSIS'
  | 'GENERATE_IDF'
  | 'DOWNLOAD_CLIMBRA'
  | 'BIAS_CORRECTION'
  | 'GENERATE_REPORT';

export type JobStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

export type JobDetails =
  | { source: 'INMET'; message: string; error_log?: string | null }
  | {
      source: 'CEMADEN';
      message: string;
      external_id?: string | null;
      polling_count: number;
      error_log?: string | null;
    }
  | {
      source: 'ANA';
      message: string;
      current_chunk: number;
      total_chunks: number;
      error_log?: string | null;
    }
  | { source: 'SYSTEM'; message: string; error_log?: string | null };

export interface Job {
  id: string;
  project_id: string;
  task_type: TaskType;
  status: JobStatus;
  progress: number;
  details: JobDetails | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}
