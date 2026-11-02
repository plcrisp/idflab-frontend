import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideClock,
  lucideCpu,
  lucideDatabase,
  lucideTrendingUp,
} from '@ng-icons/lucide';
import { MethodologyDifferentiator } from '../../models/auth-presentation.models';
import {
  METHODOLOGY_DIFFERENTIATORS,
  PRESENTATION_TEXTS,
} from '../../constants/auth-presentation.constants';

@Component({
  selector: 'app-methodology-differentiators',
  standalone: true,
  imports: [CommonModule, NgIcon],
  providers: [
    provideIcons({
      lucideDatabase,
      lucideCpu,
      lucideClock,
      lucideTrendingUp,
    }),
  ],
  templateUrl: './methodology-differentiators.html',
  styleUrl: './methodology-differentiators.scss',
})
export class MethodologyDifferentiators {
  readonly items = input<MethodologyDifferentiator[]>(METHODOLOGY_DIFFERENTIATORS);
  readonly header = PRESENTATION_TEXTS.differentiatorsHeader;
  readonly note = PRESENTATION_TEXTS.reproducibilityNote;
}

