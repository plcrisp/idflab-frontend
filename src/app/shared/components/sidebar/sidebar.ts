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

  protected readonly items = [
    {
      title: 'Dashboard',
      url: '/app/dashboard',
      icon: 'lucideHome',
    },
    {
      title: 'Central de Projetos',
      url: '/app/projetos',
      icon: 'lucideFolderOpen',
    },
    {
      title: 'Mapa Interativo',
      url: '/app/analysis/interactive-map',
      icon: 'lucideMap',
    },
  ];
}
