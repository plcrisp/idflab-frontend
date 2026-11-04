import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ProjectsService } from '../services/api/projects.service';

export const initialRouteGuard: CanActivateFn = () => {
  const projectsService = inject(ProjectsService);
  const router = inject(Router);

  return projectsService.getSidebarProjects().pipe(
    map((projects) => {
      if (!projects || projects.length === 0) {
        return router.createUrlTree(['/app/interactive-map']);
      }
      return router.createUrlTree(['/app/projects']);
    }),
    catchError(() => of(router.createUrlTree(['/app/interactive-map']))),
  );
};

