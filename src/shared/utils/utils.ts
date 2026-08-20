import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateLong(dateStr: string) {
  if (!dateStr) return '';
  try {
    const cleanDate = dateStr.split('T')[0];
    const parts = cleanDate.split('-').map(Number);
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) return dateStr;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

export function formatMonthYear(monthStr: string) {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  try {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    return monthStr;
  }
}
