import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PEAK_DATA, PRESENTATION_TEXTS } from './constants/auth-presentation.constants';
import { PeakHighlight } from './components/peak-highlight/peak-highlight';
import { HeroRainfallChart } from './components/hero-rainfall-chart/hero-rainfall-chart';
import { MethodologyDifferentiators } from './components/methodology-differentiators/methodology-differentiators';

@Component({
  selector: 'app-auth-presentation-panel',
  standalone: true,
  imports: [CommonModule, PeakHighlight, HeroRainfallChart],
  templateUrl: './auth-presentation-panel.html',
  styleUrl: './auth-presentation-panel.scss',
})
export class AuthPresentationPanel {
  readonly texts = PRESENTATION_TEXTS;
  readonly peakInfo = PEAK_DATA;
}
