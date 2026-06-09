import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getDeadlineStatus, calcNextDate, formatDate, formatDateObj } from '../utils/dateUtils'

function isOverdue(task) {
  if (getDeadlineStatus(task.last_date, task.interval_key) === 'overdue') return true
  if (!task.due_date) return false
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return new Date(task.due_date) < today
}

function getOverdueDate(task) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  if (task.due_date && new Date(task.due_date) < today) return formatDate(task.due_date)
  const next = calcNextDate(task.last_date, task.interval_key)
  if (next && next < today) return formatDateObj(next)
  return '—'
}

export default function Dashboard({ mansions, onSelectMansion }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('tasks').select('*').then(({ data }) => {
      if (data) setTasks(data)
      setLoading(false)
    })
  }, [])

  const mansionStats = mansions.map(mansion => {
    const mt = tasks.filter(t => t.mansion_id === mansion.id)
    const overdue = mt.filter(isOverdue).length
    const soon    = mt.filter(t => !isOverdue(t) && getDeadlineStatus(t.last_date, t.interval_key) === 'soon').length
    const ok      = mt.filter(t => getDeadlineStatus(t.last_date, t.interval_key) === 'ok').length
    return { mansion, overdue, soon, ok, total: mt.length }
  }).sort((a, b) => b.overdue - a.overdue || b.soon - a.soon)

  const totalOverdue = mansionStats.reduce((s, x) => s + x.overdue, 0)
  const totalSoon    = mansionStats.reduce((s, x) => s + x.soon, 0)
  const totalOk      = mansionStats.reduce((s, x) => s + x.ok, 0)

  const overdueTasks = tasks
    .filter(isOverdue)
    .map(t => ({ ...t, mansionName: mansions.find(m => m.id === t.mansion_id)?.name ?? '不明' }))
    .sort((a, b) => a.mansionName.localeCompare(b.mansionName, 'ja'))

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-sm">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-5">ダッシュボード</h1>

      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <p className="text-xs text-red-500 font-medium">期限超過</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{totalOverdue}</p>
          <p className="text-xs text-red-400 mt-0.5">件</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
          <p className="text-xs text-yellow-600 font-medium">まもなく</p>
          <p className="text-3xl font-bold text-yellow-500 mt-1">{totalSoon}</p>
          <p className="text-xs text-yellow-400 mt-0.5">件（90日以内）</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="text-xs text-green-600 font-medium">正常</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{totalOk}</p>
          <p className="text-xs text-green-400 mt-0.5">件</p>
        </div>
      </div>

      {/* 物件別ステータス */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">物件別ステータス（緊急度順）</h2>
        </div>
        {mansionStats.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">物件がありません</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {mansionStats.map(({ mansion, overdue, soon, ok, total }) => (
              <div
                key={mansion.id}
                onClick={() => onSelectMansion(mansion)}
                className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{mansion.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">計 {total} 件</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0 ml-3 flex-wrap justify-end">
                  {overdue > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 font-medium rounded-full whitespace-nowrap">
                      超過 {overdue}件
                    </span>
                  )}
                  {soon > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-600 font-medium rounded-full whitespace-nowrap">
                      まもなく {soon}件
                    </span>
                  )}
                  {overdue === 0 && soon === 0 && total > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 font-medium rounded-full">
                      正常
                    </span>
                  )}
                  {total === 0 && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">
                      タスクなし
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 期限超過タスク一覧 */}
      {overdueTasks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-700">期限超過タスク一覧</h2>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
              {overdueTasks.length}件
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">物件名</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">タスク名</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">カテゴリ</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 whitespace-nowrap">期限日</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {overdueTasks.map(task => (
                  <tr
                    key={task.id}
                    onClick={() => {
                      const mansion = mansions.find(m => m.id === task.mansion_id)
                      if (mansion) onSelectMansion(mansion)
                    }}
                    className="hover:bg-red-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{task.mansionName}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-800">{task.name}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{task.category}</td>
                    <td className="px-4 py-2.5 text-xs text-red-600 font-semibold whitespace-nowrap">
                      {getOverdueDate(task)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
