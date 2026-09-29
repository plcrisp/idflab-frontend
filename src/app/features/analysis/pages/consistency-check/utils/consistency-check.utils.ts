import { EnsureStationDataRequest, NeighborStation } from "../../../../../core/models/api/station.model";

export function buildEnsureStationDataPayload(
  neighbor: NeighborStation,
  projectId: string,
): EnsureStationDataRequest {
  const today = new Date().toISOString().split('T')[0];
  const startDate = neighbor.operation_start_date
    ? neighbor.operation_start_date.slice(0, 10)
    : '1900-01-01';
  let endDate = neighbor.last_data_date
    ? neighbor.last_data_date.slice(0, 10)
    : today;

  if (endDate > today) {
    endDate = today;
  }

  return {
    start_date: startDate,
    end_date: endDate,
    project_id: projectId,
  };
}
