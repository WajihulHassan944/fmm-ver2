const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

export const getDateOnlyKey = (value) => {
  if (value === null || value === undefined || value === '') return '';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, '0'),
      String(value.getDate()).padStart(2, '0'),
    ].join('-');
  }
  const text = String(value).trim();
  const direct = text.match(DATE_ONLY_PATTERN);
  if (direct) return `${direct[1]}-${direct[2]}-${direct[3]}`;

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return '';
  return [
    parsed.getUTCFullYear(),
    String(parsed.getUTCMonth() + 1).padStart(2, '0'),
    String(parsed.getUTCDate()).padStart(2, '0'),
  ].join('-');
};

export const dateOnlyToLocalDate = (value, time = '12:00') => {
  const key = getDateOnlyKey(value);
  if (!key) return null;
  const [year, month, day] = key.split('-').map(Number);
  const timeMatch = String(time || '').match(/^(\d{1,2}):(\d{2})/);
  const hours = Number(timeMatch?.[1] ?? 12);
  const minutes = Number(timeMatch?.[2] ?? 0);
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateOnly = (value, options = {}) => {
  const date = dateOnlyToLocalDate(value);
  if (!date) return options.fallback || 'Date TBA';
  return date.toLocaleDateString(options.locale || 'en-US', {
    month: options.month || 'short',
    day: options.day || 'numeric',
    year: options.year,
    weekday: options.weekday,
    timeZone: undefined,
  });
};

export const getDateOnlyParts = (value) => {
  const key = getDateOnlyKey(value);
  if (!key) return null;
  const [year, month, day] = key.split('-').map(Number);
  return { key, year, month, day };
};
