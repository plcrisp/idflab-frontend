import { JobStatus, TaskType, JobDetails } from './job.model';

export type NotificationType = 'SUCCESS' | 'FAILED' | 'TIMEOUT';

export interface ActiveJobItem {
  job_id: string;
  project_id: string;
  project_name: string;
  task_type: TaskType;
  status: JobStatus;
  progress: number;
  details: JobDetails | null;
}

export interface Notification {
  id: string;
  user_id: string;
  job_id: string | null;
  project_id: string | null;
  project_name: string | null;

  type: NotificationType;
  task_type: TaskType;
  details: JobDetails;

  read: boolean;
  created_at: string;
}

export interface NotificationsPanelResponse {
  active_jobs: ActiveJobItem[];
  notifications: Notification[];
  unread_count: number;
}
