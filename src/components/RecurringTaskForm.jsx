import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const FREQUENCY_OPTIONS = ['毎月', '月2回', '月3回', '週1回', '週2回', '年1回', '年2回', '年4回', '年6回', '特定月のみ', '任意設定']
const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const FREQ_MAP = {
  '毎月':  { annualCount: 12 },
  '月2回': { annualCount: 24 },
  '月3回': { annualCount: 36 },
  '週1回': { annualCount: 48 },
  '週2回': { annualCount: 96 },
  '年1回': { annualCount: 1 },
  '年2回': { annualCount: 2 },
  '年4回': { annualCount: 4 },
  '年6回': { annualCount: 6 },
}

function makeNewItem() {
  return { _key: Math.random(), id: null, name: '', frequency: '毎月', months: ALL_MONTHS, noMonth: false, vendor_cost: '', income: '' }
}

function ItemForm({ item, onChange, onDelete }) {
  function handleFrequencyChange(e) {
    const freq = e.target.value
    onChange({ ...item, frequency: freq, months: freq === '毎月' ? ALL_MONTHS : item.months })
  }

  function toggleMonth(m) {
    const next = item.months.includes(m)
      ? item.months.filter(x => x !== m)
      : [...item.months, m].sort((a, b) => a - b)
    onChange({ ...item, months: next })
  }

  const monthButtonsDisabled = item.frequency === '毎月' || item.noMonth

  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2.5 relative bg-white">
      <button
        type="button"
        onClick={onDelete}
        className="absolute top-2 right-2 text-gray-300 hover:text-red-500 text-sm px-1 leading-none"
      >
        ✕
      </button>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          細目名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={item.name}
          onChange={e => onChange({ ...item, name: e.target.value })}
          required
          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: フロアワックス"
        />
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">頻度</label>
          <select
            value={item.frequency}
            onChange={handleFrequencyChange}
            className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {FREQUENCY_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer select-none pb-1.5">
          <input
            type="checkbox"
            checked={item.noMonth}
            onChange={e => onChange({ ...item, noMonth: e.target.checked })}
            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
          />
          <span className="text-xs text-gray-500 whitespace-nowrap">実施月なし</span>
        </label>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          実施月
          {!item.noMonth && item.frequency !== '毎月' && (
            <span className="ml-1 text-gray-400">{item.months.length}ヶ月</span>
          )}
        </label>
        <div className={`grid grid-cols-6 gap-1 ${item.noMonth ? 'opacity-40 pointer-events-none' : ''}`}>
          {MONTH_LABELS.map((label, i) => {
            const m = i + 1
            const selected = item.months.includes(m)
            return (
              <button
                key={m}
                type="button"
                disabled={monthButtonsDisabled}
                onClick={() => toggleMonth(m)}
                className={`py-1 text-xs rounded border transition-colors ${
                  selected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                } ${monthButtonsDisabled ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">業者コスト（円/月）</label>
          <input
            type="number"
            value={item.vendor_cost}
            onChange={e => onChange({ ...item, vendor_cost: e.target.value })}
            min="0"
            className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">受取金額（円/月）</label>
          <input
            type="number"
            value={item.income}
            onChange={e => onChange({ ...item, income: e.target.value })}
            min="0"
            className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
      </div>
    </div>
  )
}

export default function RecurringTaskForm({ task, mansionId, onClose, onSaved }) {
  const [name, setName] = useState(task?.name ?? '')
  const [vendorName, setVendorName] = useState(task?.vendor_name ?? '')
  const [frequency, setFrequency] = useState(task?.frequency ?? '毎月')
  const [months, setMonths] = useState(task?.months?.length > 0 ? task.months : ALL_MONTHS)
  const [noMonth, setNoMonth] = useState(Array.isArray(task?.months) && task.months.length === 0)
  const [vendorCost, setVendorCost] = useState(task?.vendor_cost ?? '')
  const [income, setIncome] = useState(task?.income ?? '')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!task?.id) return
    supabase
      .from('recurring_task_items')
      .select('*')
      .eq('recurring_task_id', task.id)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data?.length > 0) {
          setItems(data.map(it => ({
            _key: Math.random(),
            id: it.id,
            name: it.name,
            frequency: it.frequency,
            months: it.months ?? [],
            noMonth: !it.months || it.months.length === 0,
            vendor_cost: it.vendor_cost,
            income: it.income,
          })))
        }
      })
  }, [task?.id])

  useEffect(() => {
    if (frequency === '毎月') setMonths(ALL_MONTHS)
  }, [frequency])

  function toggleMonth(m) {
    setMonths(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m].sort((a, b) => a - b)
    )
  }

  const hasItems = items.length > 0
  const effectiveMonths = noMonth ? [] : months
  const costNum = parseInt(vendorCost) || 0
  const incomeNum = parseInt(income) || 0

  // Preview calculation
  let annualCost = 0, annualIncome = 0
  if (hasItems) {
    for (const item of items) {
      const cost = parseInt(item.vendor_cost) || 0
      const inc = parseInt(item.income) || 0
      const itemMonths = item.noMonth ? [] : item.months
      const cnt = item.noMonth
        ? (FREQ_MAP[item.frequency]?.annualCount ?? 0)
        : itemMonths.length
      annualCost += cost * cnt
      annualIncome += inc * cnt
    }
  } else {
    const freqAnnualCount = noMonth ? (FREQ_MAP[frequency]?.annualCount ?? 0) : null
    const annualCount = freqAnnualCount !== null ? freqAnnualCount : effectiveMonths.length
    annualCost = costNum * annualCount
    annualIncome = incomeNum * annualCount
  }
  const annualProfit = annualIncome - annualCost

  async function handleSubmit(e) {
    e.preventDefault()
    if (!hasItems && !noMonth && months.length === 0) {
      setError('実施月を1つ以上選択してください。')
      return
    }
    if (hasItems) {
      for (const item of items) {
        if (!item.name.trim()) { setError('全ての細目に名前を入力してください。'); return }
        if (!item.noMonth && item.months.length === 0) {
          setError('各細目の実施月を設定するか「実施月なし」を選択してください。')
          return
        }
      }
    }
    setLoading(true)
    setError('')

    const payload = {
      name,
      vendor_name: vendorName || null,
      frequency,
      months: effectiveMonths,
      vendor_cost: hasItems ? 0 : costNum,
      income: hasItems ? 0 : incomeNum,
    }

    let taskId = task?.id
    if (task) {
      const { error: err } = await supabase.from('recurring_tasks').update(payload).eq('id', task.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { data, error: err } = await supabase
        .from('recurring_tasks')
        .insert({ ...payload, mansion_id: mansionId })
        .select()
        .single()
      if (err) { setError(err.message); setLoading(false); return }
      taskId = data.id
    }

    // Delete all existing items and re-insert
    await supabase.from('recurring_task_items').delete().eq('recurring_task_id', taskId)
    if (hasItems) {
      const itemsPayload = items.map((item, idx) => ({
        recurring_task_id: taskId,
        name: item.name.trim(),
        frequency: item.frequency,
        months: item.noMonth ? [] : item.months,
        vendor_cost: parseInt(item.vendor_cost) || 0,
        income: parseInt(item.income) || 0,
        sort_order: idx,
      }))
      const { error: err } = await supabase.from('recurring_task_items').insert(itemsPayload)
      if (err) { setError(err.message); setLoading(false); return }
    }

    onSaved()
  }

  const monthButtonsDisabled = frequency === '毎月' || noMonth

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

            {/* Task-level fields: only shown when no items */}
            {!hasItems && (
              <>
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
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      実施月
                      {!noMonth && frequency !== '毎月' && (
                        <span className="ml-2 text-xs text-gray-400">{months.length}ヶ月選択中</span>
                      )}
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={noMonth}
                        onChange={e => setNoMonth(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-500">実施月なし（頻度のみ管理）</span>
                    </label>
                  </div>
                  <div className={`grid grid-cols-6 gap-1.5 ${noMonth ? 'opacity-40 pointer-events-none' : ''}`}>
                    {MONTH_LABELS.map((label, i) => {
                      const m = i + 1
                      const selected = months.includes(m)
                      return (
                        <button
                          key={m}
                          type="button"
                          disabled={monthButtonsDisabled}
                          onClick={() => toggleMonth(m)}
                          className={`py-1.5 text-xs rounded-lg border transition-colors ${
                            selected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                          } ${monthButtonsDisabled ? 'cursor-default' : 'cursor-pointer'}`}
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
              </>
            )}

            {/* 細目セクション */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700">細目</label>
                {hasItems && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {items.length}件 — 頻度・金額は細目ごとに設定
                  </span>
                )}
              </div>
              {items.length > 0 && (
                <div className="space-y-2 mb-2">
                  {items.map(item => (
                    <ItemForm
                      key={item._key}
                      item={item}
                      onChange={updated => setItems(prev => prev.map(it => it._key === updated._key ? updated : it))}
                      onDelete={() => setItems(prev => prev.filter(it => it._key !== item._key))}
                    />
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setItems(prev => [...prev, makeNewItem()])}
                className="w-full py-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
              >
                ＋ 細目を追加
              </button>
            </div>

            {/* 収支プレビュー */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1.5">
              {!hasItems && (
                <div className="flex justify-between text-gray-500">
                  <span>1回あたり利益</span>
                  <span className={`font-medium ${(incomeNum - costNum) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(incomeNum - costNum).toLocaleString()}円
                  </span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>年間コスト合計{hasItems ? '（細目合算）' : ''}</span>
                <span>{annualCost > 0 ? `${annualCost.toLocaleString()}円` : '—'}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>年間受取合計</span>
                <span>{annualIncome > 0 ? `${annualIncome.toLocaleString()}円` : '—'}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5 font-medium">
                <span className="text-gray-700">年間利益</span>
                <span className={(annualCost === 0 && annualIncome === 0) ? 'text-gray-400' : annualProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {(annualCost === 0 && annualIncome === 0) ? '—' : `${annualProfit.toLocaleString()}円`}
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
