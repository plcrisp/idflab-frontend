import { Component, Input } from '@angular/core';
import { HeaderData } from '../../models/analysis.models';

type Resolution = 'Horária' | 'Diária';

@Component({
  selector: 'app-params-header',
  standalone: false,
  templateUrl: './params-header.html',
  styleUrl: './params-header.scss',
})
export class ParamsHeader {
  @Input() headerData: HeaderData | null = null;

  get resolution(): Resolution | null {
    if (!this.headerData) return null;

    if (this.headerData.resolution === 'daily') return 'Diária';
    if (this.headerData.resolution === 'hourly') return 'Horária';

    return 'Diária';
  }
}
