import { DestroyRef, signal, Signal } from '@angular/core';
import { defer, finalize, Observable } from 'rxjs';

export interface SkeletonCoordinatorOptions {
  delayMs?: number;
  minDurationMs?: number;
  destroyRef?: DestroyRef;
}

export class SkeletonLoadingCoordinator {
  private readonly delayMs: number;
  private readonly minDurationMs: number;

  private delayTimer: ReturnType<typeof setTimeout> | null = null;
  private minDurationTimer: ReturnType<typeof setTimeout> | null = null;
  private skeletonShownTimestamp: number | null = null;

  private readonly _isFetching = signal(false);
  readonly isFetching: Signal<boolean> = this._isFetching.asReadonly();

  private readonly _showSkeleton = signal(false);
  readonly showSkeleton: Signal<boolean> = this._showSkeleton.asReadonly();

  constructor(options: SkeletonCoordinatorOptions = {}) {
    this.delayMs = options.delayMs ?? 350;
    this.minDurationMs = options.minDurationMs ?? 250;

    if (options.destroyRef) {
      options.destroyRef.onDestroy(() => this.destroy());
    }
  }

  start(): void {
    if (this._showSkeleton()) {
      return;
    }

    if (this.delayTimer !== null) {
      return;
    }

    this.clearTimers();
    this._isFetching.set(true);

    this.delayTimer = setTimeout(() => {
      this._showSkeleton.set(true);
      this.skeletonShownTimestamp = Date.now();
      this.delayTimer = null;
    }, this.delayMs);
  }

  finish(): void {
    this._isFetching.set(false);

    if (this.delayTimer !== null) {
      clearTimeout(this.delayTimer);
      this.delayTimer = null;
      this._showSkeleton.set(false);
      this.skeletonShownTimestamp = null;
      return;
    }

    if (this._showSkeleton()) {
      const elapsed = Date.now() - (this.skeletonShownTimestamp ?? 0);
      const remaining = this.minDurationMs - elapsed;

      if (remaining > 0) {
        this.minDurationTimer = setTimeout(() => {
          this._showSkeleton.set(false);
          this.skeletonShownTimestamp = null;
          this.minDurationTimer = null;
        }, remaining);
      } else {
        this._showSkeleton.set(false);
        this.skeletonShownTimestamp = null;
      }
    }
  }

  reset(): void {
    this.clearTimers();
    this._isFetching.set(false);
    this._showSkeleton.set(false);
    this.skeletonShownTimestamp = null;
  }

  destroy(): void {
    this.reset();
  }

  private clearTimers(): void {
    if (this.delayTimer !== null) {
      clearTimeout(this.delayTimer);
      this.delayTimer = null;
    }
    if (this.minDurationTimer !== null) {
      clearTimeout(this.minDurationTimer);
      this.minDurationTimer = null;
    }
  }
}

export function trackWithSkeleton<T>(coordinator: SkeletonLoadingCoordinator) {
  return (source$: Observable<T>): Observable<T> => {
    return defer(() => {
      coordinator.start();
      return source$.pipe(
        finalize(() => {
          coordinator.finish();
        }),
      );
    });
  };
}
