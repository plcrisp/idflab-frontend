import { Component, inject, Input } from '@angular/core';
import { MainLayoutService } from '../../../core/services/state/main-layout.service';

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
  mainLayoutService = inject(MainLayoutService);

  @Input() workflowSteps: WorkflowStep[] = [];
}
