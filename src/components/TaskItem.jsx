import { INTERVALS } from '../utils/intervals'
import { calcNextDate, getDeadlineStatus, formatDate, formatDateObj } from '../utils/dateUtils'

const CATEGORY_COLORS = {
  '設備':     'bg-blue-100 text-blue-700',
  '建物':     'bg-emerald-100 text-emerald-700',
  '防災':     'bg-red-100 text-red-700',
  '衛生':     'bg-teal-100 text-teal-700',
  '電気':     'bg-yellow-100 text-yellow-700',
  '定期業務': 'bg-purple-100 text-purple-700',
  'その他':   'bg-gray-100 text-gray-600',
}

const STEP_COLORS = {
  '未着手':     'bg-gray-100 text-gray-600',
  '見積依頼済': 'bg-sky-100 text-sky-700',
  '施工待ち':   'bg-orange-100 text-orange-700',
  '実施済み':   'bg-green-100 text-green-700',
}

const DEADLINE_CONFIG = {
  overdue: { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700',       label: '期限超過' },
  soon:    { bar: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700', label: 'まもなく' },
  ok:      { bar: 'bg-green-400',  badge: null,                            label: null },
  none:    { bar: 'bg-gray-200',   badge: null,                            label: null },
}

export default function TaskItem({ task, onEdit, onDelete }) {
  const status = getDeadlineStatus(task.last_date, task.interval_key)
  const nextDate = calcNextDate(task.last_date, task.interval_key)
  const dc = DEADLINE_CONFIG[status]

  const nextDateClass =
    status === 'overdue' ? 'text-red-600 font-semibold' :
    status === 'soon'    ? 'text-yellow-600 font-semibold' : ''

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${dc.bar}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* タスク名とバッジ */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-800">{task.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[task.category] ?? 'bg-gray-100 text-gray-600'}`}>
                  {task.category}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STEP_COLORS[task.work_step] ?? 'bg-gray-100 text-gray-600'}`}>
                  {task.work_step}
                </span>
                {dc.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dc.badge}`}>
                    {dc.label}
                  </span>
                )}
              </div>

              {/* 日付情報 */}
              <div className="flex gap-4 mt-1.5 text-xs text-gray-500 flex-wrap">
                <span>最終実施: {formatDate(task.last_date)}</span>
                {task.interval_key && (
                  <span>周期: {INTERVALS[task.interval_key]?.label}</span>
                )}
                {nextDate && (
                  <span className={nextDateClass}>
                    次回期限: {formatDateObj(nextDate)}
                  </span>
                )}
              </div>

              {/* メモ */}
              {task.memo && (
                <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{task.memo}</p>
              )}
            </div>

            {/* 操作ボタン */}
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={onEdit}
                className="text-xs px-2 py-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                編集
              </button>
              <button
                onClick={onDelete}
                className="text-xs px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
