import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const FREQUENCY_OPTIONS = ['毎月', '月2回', '月3回', '週1回', '週2回', '年2回', '年4回', '年6回', '特定月のみ', '任意設定']
const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

export default function RecurringTaskForm({ task, mansionId, onClose, onSaved }) {
  const [name, setName] = useState(task?.name ?? '')
  const [vendorName, setVendorName] = useState(task?.vendor_name ?? '')
  const [frequency, setFrequency] = useState(task?.frequency ?? '毎月')
  const [months, setMonths] = useState(task?.months ?? ALL_MONTHS)
  const [vendorCost, setVendorCost] = useState(task?.vendor_cost ?? '')
  const [income, setIncome] = useState(task?.income ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (frequency === '毎月') setMonths(ALL_MONTHS)
  }, [frequency])

  function toggleMonth(m) {
    setMonths(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m].sort((a, b) => a - b)
    )
  }

  const costNum = parseInt(vendorCost) || 0
  const incomeNum = parseInt(income) || 0
  const profit = incomeNum - costNum
  const annualCost = costNum * months.length
  const annualIncome = incomeNum * months.length
  const annualProfit = annualIncome - annualCost

  async function handleSubmit(e) {
    e.preventDefault()
    if (months.length === 0) { setError('実施月を1つ以上選択してください。'); return }
    setLoading(true)
    setError('')

    const payload = {
      name,
      vendor_name: vendorName || null,
      frequency,
      months,
      vendor_cost: costNum,
      income: incomeNum,
    }

    if (task) {
      const { error } = await supabase.from('recurring_tasks').update(payload).eq('id', task.id)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { error } = await supabase.from('recurring_tasks').insert({ ...payload, mansion_id: mansionId })
      if (error) { setError(error.message); setLoading(false); return }
    }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">
            {task ? '定期業務を編集' : '定期業務を追加'}
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                業務名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 共用部清掃"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">業者名</label>
              <input
                type="text"
                value={vendorName}
                onChange={e => setVendorName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: ○○清掃株式会社"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">実施頻度</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FREQUENCY_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                実施月
                {frequency !== '毎月' && (
                  <span className="ml-2 text-xs text-gray-400">{months.length}ヶ月選択中</span>
                )}
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {MONTH_LABELS.map((label, i) => {
                  const m = i + 1
                  const selected = months.includes(m)
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={frequency === '毎月'}
                      onClick={() => toggleMonth(m)}
                      className={`py-1.5 text-xs rounded-lg border transition-colors ${
                        selected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                      } ${frequency === '毎月' ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">業者コスト（円/月）</label>
                <input
                  type="number"
                  value={vendorCost}
                  onChange={e => setVendorCost(e.target.value)}
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">受取金額（円/月）</label>
                <input
                  type="number"
                  value={income}
                  onChange={e => setIncome(e.target.value)}
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1.5">
              <div className="flex justify-between text-gray-500">
                <span>1回あたり利益</span>
                <span className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profit.toLocaleString()}円
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>年間コスト合計（{months.length}回）</span>
                <span>{annualCost.toLocaleString()}円</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>年間受取合計</span>
                <span>{annualIncome.toLocaleString()}円</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5 font-medium">
                <span className="text-gray-700">年間利益</span>
                <span className={annualProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {annualProfit.toLocaleString()}円
                </span>
              </div>
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
