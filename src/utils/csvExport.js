import { INTERVALS } from './intervals'
import { calcNextDate, formatDate, formatDateObj, getDeadlineStatus } from './dateUtils'

const DEADLINE_LABELS = {
  overdue: '期限超過',
  soon:    'まもなく',
  ok:      '正常',
  none:    '—',
}

export function exportCsv(mansionName, tasks) {
  const headers = ['物件名', 'タスク名', 'カテゴリ', '進捗', '最終実施日', '周期', '次回期限', '期限状態', 'メモ']

  const rows = tasks.map(task => {
    const nextDate = calcNextDate(task.last_date, task.interval_key)
    const status = getDeadlineStatus(task.last_date, task.interval_key)
    return [
      mansionName,
      task.name,
      task.category,
      task.work_step,
      formatDate(task.last_date),
      task.interval_key ? (INTERVALS[task.interval_key]?.label ?? '—') : '—',
      formatDateObj(nextDate),
      DEADLINE_LABELS[status] ?? '—',
      task.memo ?? '',
    ]
  })

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n')

  const bom = '﻿'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${mansionName}_tasks_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
