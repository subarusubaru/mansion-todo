import { INTERVALS } from './intervals'

export function calcNextDate(lastDate, intervalKey) {
  if (!lastDate || !intervalKey) return null
  const interval = INTERVALS[intervalKey]
  if (!interval) return null
  const d = new Date(lastDate)
  d.setDate(d.getDate() + interval.days)
  return d
}

export function getDeadlineStatus(lastDate, intervalKey) {
  const nextDate = calcNextDate(lastDate, intervalKey)
  if (!nextDate) return 'none'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const soon = new Date(today)
  soon.setDate(soon.getDate() + 90)
  if (nextDate < today) return 'overdue'
  if (nextDate <= soon) return 'soon'
  return 'ok'
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(dateStr))
}

export function formatDateObj(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
