import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StationPeakInfo } from '../../models/auth-presentation.models';
import { PEAK_DATA } from '../../constants/auth-presentation.constants';

@Component({
  selector: 'app-peak-highlight',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './peak-highlight.html',
  styleUrl: './peak-highlight.scss',
})
export class PeakHighlight {
  readonly peak = input<StationPeakInfo>(PEAK_DATA);
}

