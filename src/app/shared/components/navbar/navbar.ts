import { Component, ElementRef, HostListener, inject, Input } from '@angular/core';
import { AuthService } from '../../../features/auth/services/auth.service';
import { MainLayoutService } from '../../../core/services/state/main-layout.service';
import { Breadcrumb } from '../../../core/models/utils/main-layout.model';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private auth = inject(AuthService);
  private eRef = inject(ElementRef);
  mainLayoutService = inject(MainLayoutService);

  @Input() breadcrumbs: Breadcrumb[] = [];
  @Input() isProcessing: boolean = false;
  @Input() hasNotifications: boolean = false;

  language: 'EN' | 'PT-BR' = 'PT-BR';

  user = this.auth.user;
  userInitials = this.auth.userInitials;

  constructor() {}

  setLanguage(lang: 'EN' | 'PT-BR'): void {
    this.language = lang;
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: (response) => {
        console.log('Logout realizado com sucesso!', response);
      },
      error: (error) => {
        console.error('Erro no logout:', error);
      },
    });
  }
}
