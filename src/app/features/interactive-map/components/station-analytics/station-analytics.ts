import { Component, inject } from '@angular/core';
import { StationAnalyticsService } from '../../../../core/services/utils/station-analytics.service';
import { BRAZIL_STATES } from '../../../../shared/utils/brazil-states.constants';

@Component({
  selector: 'app-station-analytics',
  standalone: false,
  templateUrl: './station-analytics.html',
  styleUrl: './station-analytics.scss',
})
export class StationAnalytics {
  private analytics = inject(StationAnalyticsService);

  stats = this.analytics.stats;
}
