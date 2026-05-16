import { Injectable, signal } from '@angular/core';
import { Breadcrumb, WorkflowStep } from '../../models/utils/main-layout.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MainLayoutService {
  private SIDEBAR_STATE = environment.storageKeys.sidebarState;

  breadcrumbs = signal<Breadcrumb[]>([]);
  workflowSteps = signal<WorkflowStep[]>([]);

  isSidebarCollapsed = signal<boolean>(
    JSON.parse(localStorage.getItem(this.SIDEBAR_STATE) || 'false'),
  );

  setBreadcrumbs(crumbs: Breadcrumb[]) {
    this.breadcrumbs.set(crumbs);
  }

  setWorkflowStatus(activeStepId: string) {
    const steps: WorkflowStep[] = [
      { id: '1', label: 'Mapa Interativo', status: 'pending' },
      { id: '2', label: 'Inspecionar Série', status: 'pending' },
      { id: '3', label: 'Tratamento de Falhas', status: 'pending' },
      { id: '4', label: 'Análise de Consistência', status: 'pending' },
      { id: '5', label: 'Desagregação Temporal', status: 'pending' },
      { id: '6', label: 'Modelagem Estatística', status: 'pending' },
      { id: '7', label: 'IDF Histórica', status: 'pending' },
    ];

    const activeIndex = steps.findIndex((step) => step.id === activeStepId);

    const updatedSteps: WorkflowStep[] = steps.map((step, index) => {
      if (index < activeIndex) {
        return { ...step, status: 'completed' };
      }

      if (index === activeIndex) {
        return { ...step, status: 'active' };
      }

      return { ...step, status: 'pending' };
    });

    this.workflowSteps.set(updatedSteps);
  }

  clearWorkflow() {
    this.workflowSteps.set([]);
  }

  toggleSidebar() {
    this.isSidebarCollapsed.update((currentState) => {
      const newState = !currentState;

      localStorage.setItem(this.SIDEBAR_STATE, JSON.stringify(newState));
      return newState;
    });
  }
}
