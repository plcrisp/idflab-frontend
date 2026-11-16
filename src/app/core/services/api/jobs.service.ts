import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize, shareReplay } from 'rxjs/operators';
import { Job } from '../../models/api/job.model';
import { environment } from '../../../../environments/environment';
import { poll } from '../../utils/polling.utils';

export interface WatchJobOptions {
  intervalMs?: number;
  maxIntervalMs?: number;
  backoffFactor?: number;
  maxDurationMs?: number;
}

export function isJobSuccess(job: Job): boolean {
  const status = (job.status || '').toUpperCase();
  return status === 'SUCCESS' || status === 'COMPLETED' || (job.progress ?? 0) >= 100;
}

export function isJobFailed(job: Job): boolean {
  const status = (job.status || '').toUpperCase();
  return status === 'FAILED' || status === 'FAILURE' || status === 'ERROR';
}

export function isJobTerminal(job: Job): boolean {
  return isJobSuccess(job) || isJobFailed(job);
}

@Injectable({ providedIn: 'root' })
export class JobsService {
  private baseUrl = `${environment.apiUrl}/jobs`;
  private readonly activeWatchers = new Map<string, Observable<Job>>();

  constructor(private http: HttpClient) {}

  getJobsByProject(projectId: string): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.baseUrl}/project/${projectId}`);
  }

  getJob(jobId: string): Observable<Job> {
    return this.http.get<Job>(`${this.baseUrl}/${jobId}`);
  }

  watchJob(jobId: string, options?: WatchJobOptions): Observable<Job> {
    if (!options?.maxDurationMs && this.activeWatchers.has(jobId)) {
      return this.activeWatchers.get(jobId)!;
    }

    const watcher$ = poll(() => this.getJob(jobId), {
      intervalMs: options?.intervalMs ?? 2000,
      backoffFactor: options?.backoffFactor ?? 1.25,
      maxIntervalMs: options?.maxIntervalMs ?? 6000,
      jitterRatio: 0.1,
      pauseWhenHidden: true,
      maxRetries: 2,
      maxDurationMs: options?.maxDurationMs,
      propagateError: true,
      shouldContinue: (job) => !isJobTerminal(job),
    }).pipe(
      finalize(() => {
        if (!options?.maxDurationMs) {
          this.activeWatchers.delete(jobId);
        }
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    if (!options?.maxDurationMs) {
      this.activeWatchers.set(jobId, watcher$);
    }

    return watcher$;
  }

  retryCemadenCheck(jobId: string): Observable<Job> {
    return this.http.post<Job>(`${this.baseUrl}/${jobId}/retry-cemaden-check`, {});
  }
}
