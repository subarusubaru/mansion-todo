import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import RecurringTaskForm from './RecurringTaskForm'

const MONTH_SHORT = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

// months が空配列のとき頻度から年間回数・月あたり倍率を算出する
const FREQ_MAP = {
  '毎月':   { annualCount: 12, perMonth: 1 },
  '月2回':  { annualCount: 24, perMonth: 2 },
  '月3回':  { annualCount: 36, perMonth: 3 },
  '週1回':  { annualCount: 48, perMonth: 4 },
  '週2回':  { annualCount: 96, perMonth: 8 },
  '年1回':  { annualCount: 1,  perMonth: 1 / 12 },
  '年2回':  { annualCount: 2,  perMonth: 2 / 12 },
  '年4回':  { annualCount: 4,  perMonth: 4 / 12 },
  '年6回':  { annualCount: 6,  perMonth: 6 / 12 },
}

function annualCountFor(task) {
  if (task.months.length > 0) return task.months.length
  return FREQ_MAP[task.frequency]?.annualCount ?? 0
}

function monthlyCostFor(task) {
  if (task.months.length > 0) return null // caller uses months.includes()
  return Math.round((FREQ_MAP[task.frequency]?.perMonth ?? 0) * task.vendor_cost)
}

function monthlyIncomeFor(task) {
  if (task.months.length > 0) return null
  return Math.round((FREQ_MAP[task.frequency]?.perMonth ?? 0) * task.income)
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
      .select('*')
      .eq('mansion_id', mansion.id)
      .order('created_at', { ascending: true })
    if (!error && data) setTasks(data)
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

  const annualCost = tasks.reduce((sum, t) => sum + t.vendor_cost * annualCountFor(t), 0)
  const annualIncome = tasks.reduce((sum, t) => sum + t.income * annualCountFor(t), 0)
  const annualProfit = annualIncome - annualCost

  const monthlyCosts = Array.from({ length: 12 }, (_, i) =>
    tasks.reduce((sum, t) => {
      const fixed = monthlyCostFor(t)
      if (fixed !== null) return sum + fixed
      return t.months.includes(i + 1) ? sum + t.vendor_cost : sum
    }, 0)
  )
  const monthlyIncomes = Array.from({ length: 12 }, (_, i) =>
    tasks.reduce((sum, t) => {
      const fixed = monthlyIncomeFor(t)
      if (fixed !== null) return sum + fixed
      return t.months.includes(i + 1) ? sum + t.income : sum
    }, 0)
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 年間サマリー + 追加ボタン */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-400">年間コスト</span>
            <span className="ml-2 font-semibold text-gray-800">{annualCost.toLocaleString()}円</span>
          </div>
          <div>
            <span className="text-gray-400">年間受取</span>
            <span className="ml-2 font-semibold text-gray-800">{annualIncome.toLocaleString()}円</span>
          </div>
          <div>
            <span className="text-gray-400">年間利益</span>
            <span className={`ml-2 font-bold ${annualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {annualProfit.toLocaleString()}円
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
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 min-w-[160px] sticky left-0 bg-gray-50">
                      業務名
                    </th>
                    {MONTH_SHORT.map(m => (
                      <th key={m} className="text-center px-1.5 py-2.5 font-medium text-gray-500 w-8">
                        {m}月
                      </th>
                    ))}
                    <th className="text-right px-3 py-2.5 font-medium text-gray-600 whitespace-nowrap">年コスト</th>
                    <th className="text-right px-3 py-2.5 font-medium text-gray-600 whitespace-nowrap">年受取</th>
                    <th className="text-right px-3 py-2.5 font-medium text-gray-600 whitespace-nowrap">年利益</th>
                    <th className="px-3 py-2.5 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, idx) => {
                    const count = annualCountFor(task)
                    const tCost = task.vendor_cost * count
                    const tIncome = task.income * count
                    const tProfit = tIncome - tCost
                    const noMonth = task.months.length === 0
                    return (
                      <tr
                        key={task.id}
                        className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}
                      >
                        <td className={`px-4 py-2.5 sticky left-0 ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                          <div className="font-medium text-gray-800 whitespace-nowrap">{task.name}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1.5">
                            <span>{task.frequency}</span>
                            {noMonth && (
                              <span className="px-1 py-0.5 bg-gray-100 text-gray-400 rounded text-xs">実施月未設定</span>
                            )}
                          </div>
                          {task.vendor_name && (
                            <div className="text-xs text-blue-500 whitespace-nowrap">{task.vendor_name}</div>
                          )}
                        </td>
                        {Array.from({ length: 12 }, (_, i) => (
                          <td key={i} className="text-center px-1.5 py-2.5">
                            {!noMonth && task.months.includes(i + 1) ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                                ✓
                              </span>
                            ) : (
                              <span className="text-gray-200 text-xs">–</span>
                            )}
                          </td>
                        ))}
                        <td className="text-right px-3 py-2.5 text-gray-600 whitespace-nowrap">
                          {tCost.toLocaleString()}
                        </td>
                        <td className="text-right px-3 py-2.5 text-gray-600 whitespace-nowrap">
                          {tIncome.toLocaleString()}
                        </td>
                        <td className={`text-right px-3 py-2.5 font-medium whitespace-nowrap ${tProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tProfit.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5">
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
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="border-t-2 border-gray-300">
                  <tr className="bg-blue-50">
                    <td className="px-4 py-2 text-xs font-semibold text-gray-600 sticky left-0 bg-blue-50">
                      月間コスト
                    </td>
                    {monthlyCosts.map((cost, i) => (
                      <td key={i} className="text-center px-1.5 py-2 text-xs text-gray-600 whitespace-nowrap">
                        {cost > 0 ? cost.toLocaleString() : <span className="text-gray-300">–</span>}
                      </td>
                    ))}
                    <td colSpan={4}></td>
                  </tr>
                  <tr className="bg-green-50">
                    <td className="px-4 py-2 text-xs font-semibold text-gray-600 sticky left-0 bg-green-50">
                      月間受取
                    </td>
                    {monthlyIncomes.map((inc, i) => (
                      <td key={i} className="text-center px-1.5 py-2 text-xs text-gray-600 whitespace-nowrap">
                        {inc > 0 ? inc.toLocaleString() : <span className="text-gray-300">–</span>}
                      </td>
                    ))}
                    <td colSpan={4}></td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="px-4 py-2 text-xs font-semibold text-gray-600 sticky left-0 bg-gray-100">
                      月間利益
                    </td>
                    {Array.from({ length: 12 }, (_, i) => {
                      const p = monthlyIncomes[i] - monthlyCosts[i]
                      return (
                        <td key={i} className="text-center px-1.5 py-2 text-xs font-medium whitespace-nowrap">
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
