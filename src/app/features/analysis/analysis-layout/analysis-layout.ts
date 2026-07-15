import { Component, computed, DestroyRef, inject } from '@angular/core';
import { ProjectStateService } from '../services/project-state.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AnalysisStep, HeaderData } from '../models/analysis.models';
import { map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-analysis-layout',
  standalone: false,
  providers: [ProjectStateService],
  templateUrl: './analysis-layout.html',
  styleUrl: './analysis-layout.scss',
})
export class AnalysisLayout {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private projectState = inject(ProjectStateService);

  project = this.projectState.project;

  headerData = computed<HeaderData | null>(() => {
    const p = this.project();
    if (!p) return null;

    return {
      station_name: p.station.name,
      station_state: p.station.state,
      source: p.station.source,
      station_type: p.station.station_type,
      station_code: p.station.code,
      start_date: p.start_date,
      end_date: p.end_date,
    };
  });

  readonly steps: AnalysisStep[] = [
    { label: 'Mapa', path: 'interactive-map' },
    { label: 'Visualização inicial', path: 'initial-view' },
    { label: 'Tratamento de falhas', path: 'tratamento-de-falhas' },
    { label: 'Resolução temporal', path: 'resolucao-temporal' },
    { label: 'Distribuição estatística', path: 'distribuicao-estatistica' },
    { label: 'IDF histórica', path: 'idf-historica' },
    { label: 'Cenários futuros', path: 'cenarios-futuros' },
    { label: 'Resultados', path: 'resultados' },
  ];

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('projectId')),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((projectId) => {
        if (!projectId) {
          this.router.navigateByUrl('/app/dashboard');
          return;
        }
        this.projectState.loadProject(projectId);
      });
  }
}
