import { Component, ElementRef, HostListener, inject, Input } from '@angular/core';
import { AuthService } from '../../../features/auth/services/auth.service';
import { Breadcrumb } from '../../models/shared.model';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private auth = inject(AuthService);
  private eRef = inject(ElementRef);

  @Input() breadcrumbs: Breadcrumb[] = [];
  @Input() isProcessing: boolean = false;
  @Input() hasNotifications: boolean = false;

  language: 'EN' | 'PT-BR' = 'PT-BR';
  showLangMenu = false;
  showUserMenu = false;

  user = this.auth.user;
  userInitials = this.auth.userInitials;

  constructor() {}

  setLanguage(lang: 'EN' | 'PT-BR'): void {
    this.language = lang;
    this.showLangMenu = false;
  }

  toggleLangMenu(): void {
    this.showLangMenu = !this.showLangMenu;
    if (this.showLangMenu) this.showUserMenu = false;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu) this.showLangMenu = false;
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

  private getInitials(name: string): string {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  @HostListener('document:click', ['$event'])
  clickOut(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showLangMenu = false;
      this.showUserMenu = false;
    }
  }
}
