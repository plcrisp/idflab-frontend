import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class FileDownloadService {
  triggerDownload(response: HttpResponse<Blob>, fallbackFilename: string): void {
    if (!response.body) {
      throw new Error('Corpo da resposta vazio ao tentar baixar arquivo.');
    }
 
    const filename = this.extractFilename(response) ?? fallbackFilename;
 
    const blobUrl = window.URL.createObjectURL(response.body);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }
 
  private extractFilename(response: HttpResponse<Blob>): string | null {
    const contentDisposition =
      response.headers.get('content-disposition') ||
      response.headers.get('Content-Disposition');
 
    if (!contentDisposition) return null;
 
    const match = contentDisposition.match(/filename="?([^";]+)"?/i);
    return match?.[1]?.trim() ?? null;
  }
}
