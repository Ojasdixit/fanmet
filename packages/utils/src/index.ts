export const formatCurrency = (value: number, currency: string = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(value);

export const formatDateTime = (date: Date | string) =>
  new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(typeof date === 'string' ? new Date(date) : date);

export const classNames = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ');
