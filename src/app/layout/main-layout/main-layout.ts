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

  ngOnInit(): void {
    this.authService.login('pedro@example.com', 'hahaha').subscribe({
      next: () => {
        this.authService.getMe().subscribe({
          next: (user) => {
            console.log('USER:', user);
          },
          error: (err) => {
            console.error('GET ME ERROR', err);
          },
        });
      },
    });
  }
}
