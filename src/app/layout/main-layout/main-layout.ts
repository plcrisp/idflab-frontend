import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../features/auth/services/auth.service';
import { UserRegistration } from '../../features/auth/models/user.model';

@Component({
  selector: 'app-main-layout',
  standalone: false,
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout implements OnInit {
  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.auth.getMe().subscribe();
  }
}
