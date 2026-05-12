import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-overlay',
  standalone: false,
  templateUrl: './loading-overlay.html',
  styleUrl: './loading-overlay.scss',
})
export class LoadingOverlay {
  @Input() message: string = 'Carregando dados';
  @Input() visible: boolean = true;
}
