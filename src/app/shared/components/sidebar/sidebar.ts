import { Component, Input } from '@angular/core';

export interface WorkflowStep {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending';
}

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  @Input() workflowSteps: WorkflowStep[] = [];
  @Input() isAnalysisActive: boolean = false;
}
