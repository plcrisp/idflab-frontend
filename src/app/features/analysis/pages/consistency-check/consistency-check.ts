import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';

import { MainLayoutService } from '../../../../core/services/state/main-layout.service';
import { ConsistencyCheckStateService } from './services/consistency-check-state.service';

@Component({
  selector: 'app-consistency-check',
  standalone: false,
  templateUrl: './consistency-check.html',
  styleUrl: './consistency-check.scss',
  providers: [ConsistencyCheckStateService],
})
export class ConsistencyCheck {
  private mainLayoutService = inject(MainLayoutService);
  private router = inject(Router);

  readonly state = inject(ConsistencyCheckStateService);

  constructor() {
    effect(() => {
      const project = this.state.project();
      if (!project) return;

      this.mainLayoutService.setBreadcrumbs([
        { label: 'Nova Análise', url: '/app/interactive-map' },
        { label: project.name, url: `/app/project/${project.id}` },
        { label: 'Verificação de Consistência', url: `/app/analysis/${project.id}/consistency-check` },
      ]);
    });
  }

  onScrollToNeighborCard(): void {
    const el = document.getElementById('neighbor-stations-selection-card');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onSkipToYears(): void {
    const el = document.getElementById('year-selection') || document.querySelector('app-data-availability-ribbon');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onBack(): void {
    const project = this.state.project();
    if (!project) return;
    this.router.navigate(['/app/analysis', project.id, 'initial-view']);
  }

  onAdvance(): void {
    const project = this.state.project();
    if (!project) return;
    this.router.navigate(['/app/analysis', project.id, 'tratamento-de-falhas']);
  }
}
