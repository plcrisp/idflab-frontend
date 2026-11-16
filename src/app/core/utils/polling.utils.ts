import { Observable, timer, EMPTY, fromEvent, throwError, of } from 'rxjs';
import { switchMap, expand, catchError, filter, take, timeout } from 'rxjs/operators';

export interface PollOptions<T> {
  intervalMs: number;
  shouldContinue: (value: T) => boolean;
  backoffFactor?: number;
  maxIntervalMs?: number;
  jitterRatio?: number;
  pauseWhenHidden?: boolean;
  maxRetries?: number;
  maxDurationMs?: number;
  propagateError?: boolean;
}

function waitUntilVisible(): Observable<unknown> {
  if (typeof document === 'undefined' || !document.hidden) {
    return of(null);
  }
  return fromEvent(document, 'visibilitychange').pipe(
    filter(() => !document.hidden),
    take(1),
  );
}

function computeNextDelay(
  attempt: number,
  intervalMs: number,
  backoffFactor: number,
  maxIntervalMs: number,
  jitterRatio: number,
): number {
  const base = Math.min(maxIntervalMs, intervalMs * Math.pow(backoffFactor, attempt));
  if (jitterRatio <= 0) return Math.round(base);
  const offset = (Math.random() * 2 - 1) * jitterRatio * base;
  return Math.max(0, Math.round(base + offset));
}

export function poll<T>(
  fetchFn: () => Observable<T>,
  options: PollOptions<T>,
): Observable<T>;
export function poll<T>(
  fetchFn: () => Observable<T>,
  intervalMs: number,
  shouldContinue: (value: T) => boolean,
): Observable<T>;
export function poll<T>(
  fetchFn: () => Observable<T>,
  intervalOrOptions: number | PollOptions<T>,
  shouldContinueArg?: (value: T) => boolean,
): Observable<T> {
  const opts: PollOptions<T> =
    typeof intervalOrOptions === 'number'
      ? { intervalMs: intervalOrOptions, shouldContinue: shouldContinueArg! }
      : intervalOrOptions;

  const {
    intervalMs,
    shouldContinue,
    backoffFactor = 1,
    maxIntervalMs = intervalMs,
    jitterRatio = 0,
    pauseWhenHidden = true,
    maxRetries = 0,
    maxDurationMs,
    propagateError = false,
  } = opts;

  let consecutiveErrors = 0;
  let step = 0;
  const startedAt = Date.now();

  const fetchWithRetry = (): Observable<T> =>
    fetchFn().pipe(
      catchError((err) => {
        consecutiveErrors += 1;
        if (consecutiveErrors <= maxRetries) {
          const retryDelay = computeNextDelay(
            consecutiveErrors,
            intervalMs,
            backoffFactor,
            maxIntervalMs,
            jitterRatio,
          );
          return timer(retryDelay).pipe(switchMap(() => fetchWithRetry()));
        }
        return throwError(() => err);
      }),
    );

  let stream$ = fetchWithRetry().pipe(
    expand((value) => {
      consecutiveErrors = 0;
      if (!shouldContinue(value)) {
        return EMPTY;
      }

      if (maxDurationMs != null && Date.now() - startedAt >= maxDurationMs) {
        return throwError(() => new Error('Polling timeout'));
      }

      const delay = computeNextDelay(
        step,
        intervalMs,
        backoffFactor,
        maxIntervalMs,
        jitterRatio,
      );
      step += 1;

      const wait$ = pauseWhenHidden
        ? waitUntilVisible().pipe(switchMap(() => timer(delay)))
        : timer(delay);

      return wait$.pipe(switchMap(() => fetchWithRetry()));
    }),
  );

  if (maxDurationMs != null && maxDurationMs > 0) {
    stream$ = stream$.pipe(timeout({ first: maxDurationMs, each: maxDurationMs }));
  }

  if (!propagateError) {
    stream$ = stream$.pipe(
      catchError((err) => {
        console.error('Polling error:', err);
        return EMPTY;
      }),
    );
  }

  return stream$;
}
