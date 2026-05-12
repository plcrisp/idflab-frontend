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
  @Input() workflowSteps: WorkflowStep[] = [
    { id: '1', label: 'Mapa Interativo', status: 'completed' },
    { id: '2', label: 'Inspecionar Série', status: 'completed' },
    { id: '3', label: 'Tratamento de Falhas', status: 'active' },
    { id: '4', label: 'Análise de Consistência', status: 'pending' },
    { id: '5', label: 'Desagregação Temporal', status: 'pending' },
    { id: '6', label: 'Modelagem Estatística', status: 'pending' },
    { id: '7', label: 'IDF Histórica', status: 'pending' },
  ];
}
