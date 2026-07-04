import { Observable, timer, EMPTY } from 'rxjs';
import { switchMap, expand, catchError } from 'rxjs/operators';

export function poll<T>(
  fetchFn: () => Observable<T>,
  intervalMs: number,
  shouldContinue: (value: T) => boolean,
): Observable<T> {
  return fetchFn().pipe(
    expand((value) =>
      shouldContinue(value) ? timer(intervalMs).pipe(switchMap(() => fetchFn())) : EMPTY,
    ),
    catchError((err) => {
      console.error('Polling error:', err);
      return EMPTY;
    }),
  );
}
