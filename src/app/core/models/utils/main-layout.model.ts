export interface Breadcrumb {
  label: string;
  url: string;
  active?: boolean;
}

export interface WorkflowStep {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending';
}
