import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroRainfallChart } from './components/hero-rainfall-chart/hero-rainfall-chart';
import { MethodologyDifferentiators } from './components/methodology-differentiators/methodology-differentiators';
import { LOGIN_HERO_TEXTS } from './data/login-hero.data';

@Component({
  selector: 'app-auth-presentation-panel',
  standalone: true,
  imports: [CommonModule, HeroRainfallChart, MethodologyDifferentiators],
  templateUrl: './auth-presentation-panel.html',
  styleUrl: './auth-presentation-panel.scss',
})
export class AuthPresentationPanel {
  readonly texts = LOGIN_HERO_TEXTS;
}
