export function overdueText(days: number): string {
  return days > 0 ? `${days} day${days === 1 ? '' : 's'} overdue` : '';
}
