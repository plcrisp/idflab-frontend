import { AfterViewInit, Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { ProjectStateService } from '../services/project-state.service';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AnalysisStep, HeaderData } from '../shared/models/analysis.models';
import { NotificationsService } from '../../../core/services/api/notifications.service';
import { ANALYSIS_STEPS } from '../../../core/utils/project-step.utils';
import { HlmSidebarService } from '@spartan-ng/helm/sidebar';

@Component({
  selector: 'app-analysis-layout',
  standalone: false,
  providers: [ProjectStateService],
  templateUrl: './analysis-layout.html',
  styleUrl: './analysis-layout.scss',
})
export class AnalysisLayout implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private projectState = inject(ProjectStateService);
  private notificationsService = inject(NotificationsService);
  private sidebarService = inject(HlmSidebarService);

  project = this.projectState.project;
  isJobRunning = this.projectState.isJobRunning;
  hasInsufficientData = this.projectState.hasInsufficientData;

  readonly isHeaderLoading = computed<boolean>(
    () => this.isJobRunning() || this.projectState.showProjectSkeleton(),
  );

  headerData = computed<HeaderData | null>(() => {
    const p = this.project();
    if (!p) return null;

    return {
      station_name: p.station.name,
      station_state: p.station.state,
      source: p.station.source,
      station_code: p.station.code,
      start_date: p.start_date,
      end_date: p.end_date,
      resolution: p.station.resolution,
    };
  });

  readonly steps: AnalysisStep[] = [...ANALYSIS_STEPS];


  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('projectId')),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((projectId) => {
        if (!projectId) {
          this.router.navigateByUrl('/app/projects');
          return;
        }
        this.projectState.loadProject(projectId);
        this.notificationsService.refetch();
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.sidebarService.setOpen(false);
    }, 300);
  }
}
