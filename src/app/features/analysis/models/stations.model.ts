export type SourceEnum = 'CEMADEN' | 'INMET';

export interface Station {
  id: string;
  code: string;
  source: SourceEnum;
  name: string;
  city?: string | null;
  state?: string | null;
  latitude: number;
  longitude: number;
  status: string;
}
