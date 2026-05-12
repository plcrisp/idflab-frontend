import { Injectable, signal } from '@angular/core';
import { Breadcrumb, WorkflowStep } from '../models/main-layout.model';

@Injectable({
  providedIn: 'root',
})
export class MainLayoutService {
  breadcrumbs = signal<Breadcrumb[]>([]);
  workflowSteps = signal<WorkflowStep[]>([]);

  isAnalysisActive = signal<boolean>(false);

  setBreadcrumbs(crumbs: Breadcrumb[]) {
    this.breadcrumbs.set(crumbs);
  }

  setWorkflowStatus(steps: WorkflowStep[]) {
    this.workflowSteps.set(steps);
    this.isAnalysisActive.set(true);
  }

  clearWorkflow() {
    this.workflowSteps.set([]);
    this.isAnalysisActive.set(false);
  }
}
