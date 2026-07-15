import { Component, Input } from '@angular/core';
import { HeaderData } from '../../../../features/analysis/models/analysis.models';

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

    const { source, station_type } = this.headerData;

    switch (source) {
      case 'CEMADEN':
        return 'Horária';
      case 'ANA':
        return 'Diária';
      case 'INMET':
        return station_type === 'Automática' ? 'Horária' : 'Diária';
      default:
        return null;
    }
  }
}
