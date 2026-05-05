import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-theme-toggle',
  standalone: false,
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggle implements OnInit {
  isDark$;
  isReady = false;

  constructor(private themeService: ThemeService) {
    this.isDark$ = this.themeService.currentTheme$.pipe(map((theme) => theme === 'dark'));
  }

  ngOnInit() {
    setTimeout(() => {
      this.isReady = true;
    });
  }

  toggle() {
    this.themeService.toggleTheme();
  }
}
