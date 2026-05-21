import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, locale = 'pt-BR', currency = 'BRL') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
}

export function formatNumber(value: number, locale = 'pt-BR') {
  return new Intl.NumberFormat(locale).format(value)
}

export function formatPercent(value: number, locale = 'pt-BR') {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

export function formatDate(date: string | Date, locale = 'pt-BR') {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function getDeltaColor(delta: number) {
  if (delta > 0) return 'text-emerald-400'
  if (delta < 0) return 'text-red-400'
  return 'text-slate-400'
}

export function getDeltaSign(delta: number) {
  return delta > 0 ? '+' : ''
}
