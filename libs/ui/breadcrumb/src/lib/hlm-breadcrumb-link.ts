import { Directive, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
  selector: '[hlmBreadcrumbLink]',
  hostDirectives: [
    {
      directive: RouterLink,
      inputs: [
        'target',
        'queryParams',
        'fragment',
        'queryParamsHandling',
        'state',
        'info',
        'relativeTo',
        'preserveFragment',
        'skipLocationChange',
        'replaceUrl',
        'routerLink: link',
      ],
    },
  ],
  host: {
    'data-slot': 'breadcrumb-link',
  },
})
export class HlmBreadcrumbLink {
  /** The link to navigate to the page. */
  public readonly link = input<RouterLink['routerLink']>();

  constructor() {
    classes(() => {
      const hasLink = !!this.link();

      return [
        'transition-colors cursor-default',
        hasLink ? 'hover:text-(--white) cursor-pointer' : '',
      ].join(' ');
    });
  }
}
