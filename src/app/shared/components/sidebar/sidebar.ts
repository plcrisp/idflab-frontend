import { Component, inject, Input } from '@angular/core';
import { MainLayoutService } from '../../../core/services/state/main-layout.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  mainLayoutService = inject(MainLayoutService);
}
