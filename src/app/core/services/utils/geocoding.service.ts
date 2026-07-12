import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface MapboxFeature {
  id: string;
  text: string;
  place_name: string;
  center: [number, number];
  context: any[];
}

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private http = inject(HttpClient);

  searchCity(query: string): Observable<MapboxFeature[]> {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;

    return this.http
      .get<any>(url, {
        params: {
          country: 'br',
          types: 'place',
          language: 'pt',
          access_token: environment.mapboxToken,
        },
      })
      .pipe(
        map((res) => res.features || []),
        map((features: MapboxFeature[]) =>
          features.map((f) => {
            const region = f.context?.find((c) => c.id.startsWith('region'))?.text;
            return {
              ...f,
              place_name: region ? `${f.text}, ${region}` : f.text,
            };
          }),
        ),
      );
  }
}
