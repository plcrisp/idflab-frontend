import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Theme } from '../../models/utils/theme.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private storageKey = environment.storageKeys.theme;

  private theme$ = new BehaviorSubject<Theme>(this.getInitialTheme());

  currentTheme$ = this.theme$.asObservable();

  constructor() {
    this.applyTheme(this.theme$.value);
  }

  private getInitialTheme(): Theme {
    const saved = localStorage.getItem(this.storageKey) as Theme | null;

    if (saved) return saved;

    // fallback
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  toggleTheme() {
    const newTheme = this.theme$.value === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  setTheme(theme: Theme) {
    this.theme$.next(theme);
    localStorage.setItem(this.storageKey, theme);
    this.applyTheme(theme);
  }

  private applyTheme(theme: Theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }
}
