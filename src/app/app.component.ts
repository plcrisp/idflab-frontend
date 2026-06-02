import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: false,
  template: `
    <router-outlet></router-outlet>
    <hlm-toaster />
  `,
})
export class AppComponent {}
