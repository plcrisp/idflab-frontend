import { Component, computed, input } from '@angular/core';
import { HeaderData } from '../../models/analysis.models';

type Resolution = 'Horária' | 'Diária';

@Component({
  selector: 'app-params-header',
  standalone: false,
  templateUrl: './params-header.html',
  styleUrl: './params-header.scss',
})
export class ParamsHeader {
  headerData = input<HeaderData | null>(null);
  loading = input<boolean>(false);
  hasInsufficientData = input<boolean>(false);

  readonly resolution = computed<Resolution | null>(() => {
    const data = this.headerData();
    if (!data) return null;

    if (data.resolution === 'daily') return 'Diária';
    if (data.resolution === 'hourly') return 'Horária';

    return 'Diária';
  });
}
