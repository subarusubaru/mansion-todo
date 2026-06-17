import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import RecurringTaskForm from './RecurringTaskForm'

const MONTH_SHORT = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

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

function itemAnnualCount(item) {
  const noMonth = !item.months || item.months.length === 0
  if (noMonth) return FREQ_MAP[item.frequency]?.annualCount ?? 0
  return item.months.length
}

export default function RecurringTaskList({ mansion }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('recurring_tasks')
      .select('*, recurring_task_items(*)')
      .eq('mansion_id', mansion.id)
      .order('created_at', { ascending: true })
    if (!error && data) {
      setTasks(data.map(t => ({
        ...t,
        recurring_task_items: (t.recurring_task_items || []).sort((a, b) => a.sort_order - b.sort_order),
      })))
    }
    setLoading(false)
  }, [mansion.id])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function handleDelete(id) {
    if (!confirm('この定期業務を削除しますか？')) return
    await supabase.from('recurring_tasks').delete().eq('id', id)
    fetchTasks()
  }

  function openAdd() { setEditingTask(null); setShowForm(true) }
  function openEdit(task) { setEditingTask(task); setShowForm(true) }

  // Global annual and per-month totals
  let totalAnnualCost = 0, totalAnnualIncome = 0
  const monthlyCosts = Array(12).fill(0)
  const monthlyIncomes = Array(12).fill(0)

  for (const task of tasks) {
    const items = task.recurring_task_items || []
    if (items.length > 0) {
      for (const item of items) {
        const cnt = itemAnnualCount(item)
        totalAnnualCost += item.vendor_cost * cnt
        totalAnnualIncome += item.income * cnt
        if (item.months && item.months.length > 0) {
          for (const m of item.months) {
            monthlyCosts[m - 1] += item.vendor_cost
            monthlyIncomes[m - 1] += item.income
          }
        }
      }
    } else {
      totalAnnualCost += task.vendor_cost * 12
      totalAnnualIncome += task.income * 12
      for (let i = 0; i < 12; i++) {
        if (task.months.length === 0 || task.months.includes(i + 1)) {
          monthlyCosts[i] += task.vendor_cost
          monthlyIncomes[i] += task.income
        }
      }
    }
  }
  const totalAnnualProfit = totalAnnualIncome - totalAnnualCost

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 年間サマリー + 追加ボタン */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-400">年間コスト</span>
            <span className="ml-2 font-semibold text-gray-800">{totalAnnualCost.toLocaleString()}円</span>
          </div>
          <div>
            <span className="text-gray-400">年間受取</span>
            <span className="ml-2 font-semibold text-gray-800">{totalAnnualIncome.toLocaleString()}円</span>
          </div>
          <div>
            <span className="text-gray-400">年間利益</span>
            <span className={`ml-2 font-bold ${totalAnnualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalAnnualProfit.toLocaleString()}円
            </span>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 定期業務追加
        </button>
      </div>

      {/* カレンダーテーブル */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center text-gray-400 py-12">読み込み中...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            「+ 定期業務追加」から定期業務を登録してください。
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200">
            <table className="w-full text-sm border-collapse table-fixed [&_th]:border-r [&_th]:border-gray-200 [&_td]:border-r [&_td]:border-gray-200 [&_th:last-child]:border-r-0 [&_td:last-child]:border-r-0">
                <colgroup>
                  <col className="w-40" />
                  {Array.from({ length: 12 }, (_, i) => <col key={i} className="w-10" />)}
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-16" />
                </colgroup>
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="sticky top-0 z-10 text-left px-3 py-2.5 font-medium text-gray-600 bg-gray-50">
                      業務名
                    </th>
                    {MONTH_SHORT.map(m => (
                      <th key={m} className="sticky top-0 z-10 text-center py-2.5 font-medium text-gray-500 bg-gray-50 text-xs">
                        {m}月
                      </th>
                    ))}
                    <th className="sticky top-0 z-10 text-right px-2 py-2.5 font-medium text-gray-600 bg-gray-50 text-xs">年コスト</th>
                    <th className="sticky top-0 z-10 text-right px-2 py-2.5 font-medium text-gray-600 bg-gray-50 text-xs">年受取</th>
                    <th className="sticky top-0 z-10 text-right px-2 py-2.5 font-medium text-gray-600 bg-gray-50 text-xs">年利益</th>
                    <th className="sticky top-0 z-10 bg-gray-50"></th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.flatMap((task) => {
                    const items = task.recurring_task_items || []
                    const hasItems = items.length > 0
                    const noMonth = task.months.length === 0

                    if (hasItems) {
                      // Aggregate costs from items
                      let taskAnnualCost = 0, taskAnnualIncome = 0
                      for (const item of items) {
                        const cnt = itemAnnualCount(item)
                        taskAnnualCost += item.vendor_cost * cnt
                        taskAnnualIncome += item.income * cnt
                      }
                      const taskAnnualProfit = taskAnnualIncome - taskAnnualCost

                      return [
                        // Group header row
                        <tr key={`task-${task.id}`} className="border-b border-gray-200 bg-gray-50">
                          <td className="px-3 py-2">
                            <div className="font-semibold text-gray-700 truncate">{task.name}</div>
                            {task.vendor_name && (
                              <div className="text-xs text-blue-500 truncate">{task.vendor_name}</div>
                            )}
                          </td>
                          {Array.from({ length: 12 }, (_, i) => (
                            <td key={i} className="px-1.5 py-2" />
                          ))}
                          <td className="text-right px-2 py-2 text-gray-600 font-medium text-xs truncate">
                            {taskAnnualCost.toLocaleString()}
                          </td>
                          <td className="text-right px-2 py-2 text-gray-600 font-medium text-xs truncate">
                            {taskAnnualIncome.toLocaleString()}
                          </td>
                          <td className={`text-right px-2 py-2 font-semibold text-xs truncate ${taskAnnualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {taskAnnualProfit.toLocaleString()}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              <button
                                onClick={() => openEdit(task)}
                                className="text-xs px-2 py-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                編集
                              </button>
                              <button
                                onClick={() => handleDelete(task.id)}
                                className="text-xs px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                削除
                              </button>
                            </div>
                          </td>
                        </tr>,
                        // Item rows
                        ...items.map((item, itemIdx) => {
                          const noMonthItem = !item.months || item.months.length === 0
                          const cnt = itemAnnualCount(item)
                          const itemAnnualCost = item.vendor_cost * cnt
                          const itemAnnualIncome = item.income * cnt
                          const itemAnnualProfit = itemAnnualIncome - itemAnnualCost
                          const isLastItem = itemIdx === items.length - 1

                          return (
                            <tr
                              key={`item-${item.id}`}
                              className={`border-b ${isLastItem ? 'border-gray-300' : 'border-gray-100'} bg-white hover:bg-slate-50`}
                            >
                              <td className="px-3 py-2">
                                <div className="flex items-start gap-1">
                                  <span className="text-slate-400 text-xs mt-0.5 flex-shrink-0">└</span>
                                  <div className="min-w-0">
                                    <div className="text-slate-600 truncate">{item.name}</div>
                                    <div className="text-xs text-slate-400 flex items-center gap-1">
                                      <span className="truncate">{item.frequency}</span>
                                      {noMonthItem && (
                                        <span className="px-1 py-0.5 bg-slate-100 text-slate-400 rounded flex-shrink-0">未設定</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              {Array.from({ length: 12 }, (_, i) => (
                                <td key={i} className="text-center px-1.5 py-2">
                                  {!noMonthItem && item.months.includes(i + 1) ? (
                                    <span className="inline-flex items-center justify-center w-5 h-5 bg-sky-100 text-sky-600 rounded-full text-xs font-bold">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="text-slate-200 text-xs">–</span>
                                  )}
                                </td>
                              ))}
                              <td className="text-right px-2 py-2 text-slate-500 truncate">
                                {itemAnnualCost.toLocaleString()}
                              </td>
                              <td className="text-right px-2 py-2 text-slate-500 truncate">
                                {itemAnnualIncome.toLocaleString()}
                              </td>
                              <td className={`text-right px-2 py-2 font-medium truncate ${itemAnnualProfit >= 0 ? 'text-teal-600' : 'text-rose-500'}`}>
                                {itemAnnualProfit.toLocaleString()}
                              </td>
                              <td className="px-3 py-2" />
                            </tr>
                          )
                        }),
                      ]
                    }

                    // No items: single task row (backward compat)
                    const tCost = task.vendor_cost * 12
                    const tIncome = task.income * 12
                    const tProfit = tIncome - tCost
                    return [
                      <tr key={task.id} className="border-b border-gray-100 bg-white hover:bg-gray-50">
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-gray-800 truncate">{task.name}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1.5">
                            <span className="truncate">{task.frequency}</span>
                            {noMonth && (
                              <span className="px-1 py-0.5 bg-gray-100 text-gray-400 rounded text-xs flex-shrink-0">未設定</span>
                            )}
                          </div>
                          {task.vendor_name && (
                            <div className="text-xs text-blue-500 truncate">{task.vendor_name}</div>
                          )}
                        </td>
                        {Array.from({ length: 12 }, (_, i) => (
                          <td key={i} className="text-center py-2.5">
                            {!noMonth && task.months.includes(i + 1) ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                                ✓
                              </span>
                            ) : (
                              <span className="text-gray-200 text-xs">–</span>
                            )}
                          </td>
                        ))}
                        <td className="text-right px-2 py-2.5 text-gray-600 truncate">
                          {tCost.toLocaleString()}
                        </td>
                        <td className="text-right px-2 py-2.5 text-gray-600 truncate">
                          {tIncome.toLocaleString()}
                        </td>
                        <td className={`text-right px-2 py-2.5 font-medium truncate ${tProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tProfit.toLocaleString()}
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEdit(task)}
                              className="text-xs px-2 py-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="text-xs px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              削除
                            </button>
                          </div>
                        </td>
                      </tr>,
                    ]
                  })}
                </tbody>
                <tfoot className="border-t-2 border-gray-300">
                  <tr className="bg-blue-50">
                    <td className="px-3 py-2 text-xs font-semibold text-gray-600">月間コスト</td>
                    {monthlyCosts.map((cost, i) => (
                      <td key={i} className="text-center py-2 text-xs text-gray-600 truncate">
                        {cost > 0 ? cost.toLocaleString() : <span className="text-gray-300">–</span>}
                      </td>
                    ))}
                    <td colSpan={4}></td>
                  </tr>
                  <tr className="bg-green-50">
                    <td className="px-3 py-2 text-xs font-semibold text-gray-600">月間受取</td>
                    {monthlyIncomes.map((inc, i) => (
                      <td key={i} className="text-center py-2 text-xs text-gray-600 truncate">
                        {inc > 0 ? inc.toLocaleString() : <span className="text-gray-300">–</span>}
                      </td>
                    ))}
                    <td colSpan={4}></td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="px-3 py-2 text-xs font-semibold text-gray-600">月間利益</td>
                    {Array.from({ length: 12 }, (_, i) => {
                      const p = monthlyIncomes[i] - monthlyCosts[i]
                      return (
                        <td key={i} className="text-center py-2 text-xs font-medium truncate">
                          {monthlyCosts[i] > 0 || monthlyIncomes[i] > 0 ? (
                            <span className={p >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {p.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-300">–</span>
                          )}
                        </td>
                      )
                    })}
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
          </div>
        )}
      </div>

      {showForm && (
        <RecurringTaskForm
          task={editingTask}
          mansionId={mansion.id}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchTasks() }}
        />
      )}
    </div>
  )
}
