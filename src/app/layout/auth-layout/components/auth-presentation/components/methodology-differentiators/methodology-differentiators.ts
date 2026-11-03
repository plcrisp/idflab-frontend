import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideDatabase,
  lucideSliders,
  lucideTrendingUp,
} from '@ng-icons/lucide';
import {
  LOGIN_HERO_DIFFERENTIATORS,
  PresentationDifferentiator,
} from '../../data/login-hero.data';

@Component({
  selector: 'app-methodology-differentiators',
  standalone: true,
  imports: [CommonModule, NgIcon],
  providers: [
    provideIcons({
      lucideDatabase,
      lucideSliders,
      lucideTrendingUp,
    }),
  ],
  templateUrl: './methodology-differentiators.html',
  styleUrl: './methodology-differentiators.scss',
})
export class MethodologyDifferentiators {
  readonly items: PresentationDifferentiator[] = LOGIN_HERO_DIFFERENTIATORS;
}
