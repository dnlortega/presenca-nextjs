const TZ = 'America/Sao_Paulo';

export function getSaoPauloDateRange(): { start: Date; end: Date } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(now);
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const year = parts.find(p => p.type === 'year')?.value;

  if (!month || !day || !year) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }

  const start = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

export function getSaoPauloRefDate(): Date {
  const { start } = getSaoPauloDateRange();
  return new Date(Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate(),
    12, 0, 0
  ));
}
