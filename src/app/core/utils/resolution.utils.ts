export type Resolution = 'Sub-horária' | 'Horária' | 'Diária' | string;

export function formatTemporalResolution(resolution?: string | null): string {
  if (!resolution) return '-';
  const lower = resolution.toLowerCase().trim();
  if (lower === 'sub-hourly' || lower === 'sub_hourly' || lower === 'subhourly' || lower.includes('10')) {
    return 'Sub-horária';
  }
  if (lower === 'hourly' || lower === 'hour') {
    return 'Horária';
  }
  if (lower === 'daily' || lower === 'day') {
    return 'Diária';
  }
  if (lower === 'monthly' || lower === 'month') {
    return 'Mensal';
  }
  return resolution.charAt(0).toUpperCase() + resolution.slice(1);
}

export function isSubDailyResolution(resolution?: string | null): boolean {
  if (!resolution) return false;
  const lower = resolution.toLowerCase().trim();
  return (
    lower === 'sub-hourly' ||
    lower === 'sub_hourly' ||
    lower === 'subhourly' ||
    lower === 'hourly' ||
    lower === 'hour' ||
    lower.includes('10')
  );
}
