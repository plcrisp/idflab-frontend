import { YearlySummaryItem } from '../models/initial-visualization.model';

export function findRecordYear(data: YearlySummaryItem[]): number | null {
  const best = data.reduce<YearlySummaryItem | null>((acc, item) => {
    if (item.max_value === null) return acc;
    if (!acc || acc.max_value === null || item.max_value > acc.max_value) return item;
    return acc;
  }, null);

  return best?.year ?? null;
}

export function isFullYearWindow(start: string, end: string): boolean {
  const startYear = start.slice(0, 4);
  const endYear = end.slice(0, 4);

  return (
    startYear === endYear &&
    start.slice(5, 10) === '01-01' &&
    end.slice(5, 10) === '12-31'
  );
}

export function getRecordsLabel(resolution?: string): string {
  if (!resolution) return '';
  return resolution === 'daily' ? 'registros diários' : 'registros horários';
}

export function formatMaxDate(dateStr: string | null | undefined, isHourly: boolean): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();

  if (!isHourly) {
    return `${day}/${month}/${year}`;
  }

  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

