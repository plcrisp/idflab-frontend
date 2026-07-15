import { StationSource, StationTypeEnum } from '../../../core/models/api/station.model';

export interface HeaderData {
  station_name: string;
  station_state: string | null;
  source: StationSource;
  station_type: StationTypeEnum;
  station_code: string;
  start_date: string;
  end_date: string;
}
