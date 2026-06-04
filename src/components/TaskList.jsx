import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { CATEGORIES, WORK_STEPS } from '../utils/intervals'
import { getDeadlineStatus } from '../utils/dateUtils'
import { exportCsv } from '../utils/csvExport'
import TaskItem from './TaskItem'
import TaskForm from './TaskForm'

export default function TaskList({ mansion }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filters, setFilters] = useState({
    work_step: 'all',
    category:  'all',
    deadline:  'all',
  })

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('mansion_id', mansion.id)
      .order('created_at', { ascending: false })
    if (data) setTasks(data)
    setLoading(false)
  }, [mansion.id])

  // 初回取得
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // リアルタイム購読
  useEffect(() => {
    const channel = supabase
      .channel(`tasks:${mansion.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `mansion_id=eq.${mansion.id}`,
        },
        payload => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev =>
              prev.some(t => t.id === payload.new.id)
                ? prev
                : [payload.new, ...prev]
            )
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev =>
              prev.map(t => t.id === payload.new.id ? payload.new : t)
            )
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mansion.id])

  async function handleDelete(taskId) {
    if (!confirm('このタスクを削除しますか？')) return
    await supabase.from('tasks').delete().eq('id', taskId)
  }

  function openAdd() {
    setEditingTask(null)
    setShowForm(true)
  }

  function openEdit(task) {
    setEditingTask(task)
    setShowForm(true)
  }

  function setFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value }))
  }

  function resetFilters() {
    setFilters({ work_step: 'all', category: 'all', deadline: 'all' })
  }

  const hasFilter = filters.work_step !== 'all' || filters.category !== 'all' || filters.deadline !== 'all'

  const filteredTasks = tasks.filter(task => {
    if (filters.work_step !== 'all' && task.work_step !== filters.work_step) return false
    if (filters.category !== 'all' && task.category !== filters.category) return false
    if (filters.deadline !== 'all') {
      const status = getDeadlineStatus(task.last_date, task.interval_key)
      if (status !== filters.deadline) return false
    }
    return true
  })

  const overdueCount = tasks.filter(t => getDeadlineStatus(t.last_date, t.interval_key) === 'overdue').length
  const soonCount    = tasks.filter(t => getDeadlineStatus(t.last_date, t.interval_key) === 'soon').length

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-800">{mansion.name}</h2>
              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block"></span>
                リアルタイム
              </span>
            </div>
            {mansion.address && (
              <p className="text-sm text-gray-500 mt-0.5">{mansion.address}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs text-gray-400">計 {tasks.length} 件</span>
              {overdueCount > 0 && (
                <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                  期限超過 {overdueCount}件
                </span>
              )}
              {soonCount > 0 && (
                <span className="text-xs text-yellow-600 font-medium bg-yellow-50 px-2 py-0.5 rounded-full">
                  まもなく {soonCount}件
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportCsv(mansion.name, tasks)}
              disabled={tasks.length === 0}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              CSVエクスポート
            </button>
            <button
              onClick={openAdd}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + タスク追加
            </button>
          </div>
        </div>

        {/* フィルター */}
        <div className="flex gap-2 mt-3 flex-wrap items-center">
          <select
            value={filters.work_step}
            onChange={e => setFilter('work_step', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="all">進捗: すべて</option>
            {WORK_STEPS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={filters.category}
            onChange={e => setFilter('category', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="all">カテゴリ: すべて</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={filters.deadline}
            onChange={e => setFilter('deadline', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="all">期限: すべて</option>
            <option value="overdue">期限超過</option>
            <option value="soon">まもなく（90日以内）</option>
            <option value="ok">正常</option>
            <option value="none">期限なし</option>
          </select>

          {hasFilter && (
            <button
              onClick={resetFilters}
              className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
            >
              リセット
            </button>
          )}
        </div>
      </div>

      {/* タスク一覧 */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center text-gray-400 py-12">読み込み中...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            {tasks.length === 0
              ? '「+ タスク追加」からタスクを登録してください。'
              : 'フィルター条件に一致するタスクがありません。'}
          </div>
        ) : (
          <div className="space-y-2 max-w-4xl">
            {filteredTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={() => openEdit(task)}
                onDelete={() => handleDelete(task.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <TaskForm
          task={editingTask}
          mansionId={mansion.id}
          onClose={() => setShowForm(false)}
          onSaved={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
