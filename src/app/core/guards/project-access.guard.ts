import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ProjectsService } from '../services/api/projects.service';
import { getRouteForStep, getStepForRoute, isStepBeyond } from '../utils/project-step.utils';

function extractProjectId(route: ActivatedRouteSnapshot): string | null {
  let current: ActivatedRouteSnapshot | null = route;
  while (current) {
    const id = current.paramMap.get('projectId') || current.paramMap.get('id');
    if (id) {
      return id;
    }
    current = current.parent;
  }
  return null;
}

export const projectAccessGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const projectService = inject(ProjectsService);
  const router = inject(Router);

  const projectId = extractProjectId(route);
  if (!projectId) {
    console.warn('[ProjectAccessGuard] Project ID not found in route parameters.');
    return router.createUrlTree(['/app/dashboard']);
  }

  return projectService.getProjectById(projectId).pipe(
    map((project) => {
      projectService.setCurrentProject(project);

      const furthestStep = project.furthest_step;
      const furthestStepRoute = getRouteForStep(furthestStep);

      const cleanUrl = state.url.split('?')[0].split('#')[0];
      const segments = cleanUrl.split('/').filter(Boolean);
      const projectIdx = segments.indexOf(projectId);

      const basePathSegments =
        projectIdx !== -1
          ? segments.slice(0, projectIdx + 1)
          : ['app', 'analysis', projectId];

      const stepSegment =
        projectIdx !== -1 && projectIdx + 1 < segments.length
          ? segments[projectIdx + 1]
          : null;

      // Accessing base project route (e.g. /app/analysis/:projectId or /projects/:id)
      if (!stepSegment) {
        return router.createUrlTree([...basePathSegments, furthestStepRoute], {
          queryParams: route.queryParams,
          fragment: route.fragment ?? undefined,
        });
      }

      // Accessing a step directly
      const requestedStep = getStepForRoute(stepSegment);
      if (requestedStep && isStepBeyond(requestedStep, furthestStep)) {
        console.warn(
          `[ProjectAccessGuard] Attempted to access step '${requestedStep}' beyond furthest step '${furthestStep}'. Redirecting...`,
        );
        return router.createUrlTree([...basePathSegments, furthestStepRoute], {
          queryParams: route.queryParams,
          fragment: route.fragment ?? undefined,
        });
      }

      return true;
    }),
    catchError((err) => {
      console.error('[ProjectAccessGuard] Error verifying project access:', err);
      return of(router.createUrlTree(['/app/dashboard']));
    }),
  );
};

export const projectStepGuard: CanActivateFn = projectAccessGuard;
export const projectAccessChildGuard: CanActivateChildFn = projectAccessGuard;
