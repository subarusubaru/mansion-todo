import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { CATEGORIES, WORK_STEPS, INTERVALS } from '../utils/intervals'
import { calcNextDate, formatDateObj } from '../utils/dateUtils'

export default function TaskForm({ task, mansionId, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:         task?.name         ?? '',
    category:     task?.category     ?? 'その他',
    last_date:    task?.last_date    ?? '',
    interval_key: task?.interval_key ?? '',
    work_step:    task?.work_step    ?? '未着手',
    memo:         task?.memo         ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  const nextDate = calcNextDate(form.last_date, form.interval_key)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      name:         form.name,
      category:     form.category,
      last_date:    form.last_date    || null,
      interval_key: form.interval_key || null,
      work_step:    form.work_step,
      memo:         form.memo         || null,
    }

    if (task) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', task.id)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { error } = await supabase.from('tasks').insert({ ...payload, mansion_id: mansionId })
      if (error) { setError(error.message); setLoading(false); return }
    }

    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">
            {task ? 'タスクを編集' : 'タスクを追加'}
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* タスク名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                タスク名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例: 消防設備点検"
              />
            </div>

            {/* カテゴリ / 進捗 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                <select
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">進捗ステータス</label>
                <select
                  value={form.work_step}
                  onChange={e => set('work_step', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {WORK_STEPS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* 最終実施日 / 周期 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最終実施日</label>
                <input
                  type="date"
                  value={form.last_date}
                  onChange={e => set('last_date', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">周期</label>
                <select
                  value={form.interval_key}
                  onChange={e => set('interval_key', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">なし</option>
                  {Object.entries(INTERVALS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 次回期限プレビュー */}
            {nextDate && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm text-blue-700">
                次回期限: <span className="font-semibold">{formatDateObj(nextDate)}</span>
              </div>
            )}

            {/* メモ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
              <textarea
                value={form.memo}
                onChange={e => set('memo', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="備考・詳細メモ..."
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
