import { Component } from '@angular/core';
import { AuthService } from '../../features/auth/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: false,
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  constructor(private authService: AuthService) {}

  fazerLogin(): void {
    this.authService.login('user@example.com', 'string').subscribe({
      next: () => {
        console.log('✅ Logado! Verifique o LocalStorage.');
      },
      error: (err) => console.error('Erro no login', err),
    });
  }

  testarRotaProtegida(): void {
    console.log('Chamando /me...');
    this.authService.getMe().subscribe({
      next: (user) => {
        console.log('✅ USER:', user);
      },
      error: (err) => {
        console.error('❌ GET ME ERROR', err);
      },
    });
  }

  sair() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Deslogado com sucesso do backend');
      },
      error: (err) => {
        console.error('Erro no logout da API, mas o storage já foi limpo', err);
      },
    });
  }
}
