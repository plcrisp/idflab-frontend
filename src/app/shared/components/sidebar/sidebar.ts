import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith } from 'rxjs';
import { MainLayoutService } from '../../../core/services/state/main-layout.service';
import { ProjectsService } from '../../../core/services/api/projects.service';
import { SidebarProject } from '../../../core/models/api/project.model';

interface SidebarState {
  loading: boolean;
  projects: SidebarProject[];
}

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  mainLayoutService = inject(MainLayoutService);
  projectsService = inject(ProjectsService);

  state = toSignal(
    this.projectsService.getSidebarProjects().pipe(
      map((projects): SidebarState => {
        console.log(projects);
        return { loading: false, projects };
      }),
      startWith<SidebarState>({ loading: true, projects: [] }),
      catchError((err) => {
        console.error(err);
        return of<SidebarState>({ loading: false, projects: [] });
      }),
    ),
    { initialValue: { loading: true, projects: [] } },
  );

  protected readonly items = [
    { title: 'Dashboard', url: '/app/dashboard', icon: 'lucideHome' },
    { title: 'Central de Projetos', url: '/app/projetos', icon: 'lucideFolderOpen' },
    { title: 'Mapa Interativo', url: '/app/analysis/interactive-map', icon: 'lucideMap' },
  ];
}
