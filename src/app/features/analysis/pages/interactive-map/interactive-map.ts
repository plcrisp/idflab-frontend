import { Component, inject } from '@angular/core';
import { MainLayoutService } from '../../../../core/services/main-layout.service';

@Component({
  selector: 'app-interactive-map',
  standalone: false,
  templateUrl: './interactive-map.html',
  styleUrl: './interactive-map.scss',
})
export class InteractiveMap {
  private MainLayoutService = inject(MainLayoutService);

  ngOnInit() {
    this.MainLayoutService.setBreadcrumbs([
      { label: 'Nova Análise' },
      { label: 'Mapa Interativo', active: true },
    ]);

    this.MainLayoutService.setWorkflowStatus([
      { id: '1', label: 'Mapa Interativo', status: 'active' },
      { id: '2', label: 'Inspecionar Série', status: 'pending' },
      { id: '3', label: 'Tratamento de Falhas', status: 'pending' },
      { id: '4', label: 'Análise de Consistência', status: 'pending' },
      { id: '5', label: 'Desagregação Temporal', status: 'pending' },
      { id: '6', label: 'Modelagem Estatística', status: 'pending' },
      { id: '7', label: 'IDF Histórica', status: 'pending' },
    ]);
  }
}
