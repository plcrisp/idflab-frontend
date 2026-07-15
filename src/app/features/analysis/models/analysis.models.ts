import { StationSource, StationTypeEnum } from '../../../core/models/api/station.model';

export interface HeaderData {
  station_name: string;
  station_state: string | null;
  source: StationSource;
  station_code: string;
  start_date: string;
  end_date: string;
  resolution: string;
}

export interface AnalysisStep {
  label: string;
  path: string;
}

export type StatCardFooter =
  | { type: 'text'; content: string }
  | { type: 'progress'; value: number; max: number }
  | null;
