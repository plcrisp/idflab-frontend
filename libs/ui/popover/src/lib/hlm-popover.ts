import { Directive, effect, inject } from '@angular/core';
import { BrnPopover } from '@spartan-ng/brain/popover';
import { ConnectedPosition, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';

@Directive({
  selector: '[hlmPopover],hlm-popover',
  hostDirectives: [
    {
      directive: BrnPopover,
      inputs: [
        'align',
        'autoFocus',
        'attachTo',
        'closeDelay',
        'closeOnOutsidePointerEvents',
        'offsetX',
        'restoreFocus',
        'sideOffset',
        'state',
      ],
      outputs: ['stateChanged', 'closed'],
    },
  ],
})
export class HlmPopover {
  private readonly _brnPopover = inject(BrnPopover);

  constructor() {
    // Configura a estratégia de posicionamento do CDK para evitar que o popover
    // ultrapasse as bordas da tela ou do container do sheet.
    effect(() => {
      const strategy = this._brnPopover.mutablePositionStrategy();
      if (strategy && 'withPush' in strategy) {
        const flexible = strategy as FlexibleConnectedPositionStrategy;
        flexible.withPush(true).withViewportMargin(12);

        const align = (this._brnPopover.align() ?? 'center') as 'center' | 'start' | 'end';
        const sideOffset = Number(this._brnPopover.sideOffset() ?? 4);
        const offsetX = Number(this._brnPopover.offsetX() ?? 0);

        const horizontal: ('center' | 'start' | 'end')[] =
          align === 'end'
            ? ['end', 'center', 'start']
            : align === 'start'
            ? ['start', 'center', 'end']
            : ['center', 'end', 'start'];

        const positions: ConnectedPosition[] = [];
        // Posições abaixo
        for (const h of horizontal) {
          positions.push({
            originX: h,
            originY: 'bottom',
            overlayX: h,
            overlayY: 'top',
            offsetY: sideOffset,
            offsetX,
          });
        }
        // Posições acima
        for (const h of horizontal) {
          positions.push({
            originX: h,
            originY: 'top',
            overlayX: h,
            overlayY: 'bottom',
            offsetY: -sideOffset,
            offsetX,
          });
        }

        flexible.withPositions(positions);
      }
    });
  }
}
