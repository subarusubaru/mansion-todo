import { useState, useEffect, Fragment } from 'react'
import { supabase } from '../lib/supabase'

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

export default function AnnualSchedule({ mansions }) {
  const [allTasks, setAllTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('recurring_tasks')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setAllTasks(data)
        setLoading(false)
      })
  }, [])

  const mansionGroups = mansions
    .map(m => ({ mansion: m, tasks: allTasks.filter(t => t.mansion_id === m.id) }))
    .filter(g => g.tasks.length > 0)

  // 全物件の月間合計
  const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
    const cost   = allTasks.reduce((s, t) => t.months.includes(i + 1) ? s + t.vendor_cost : s, 0)
    const income = allTasks.reduce((s, t) => t.months.includes(i + 1) ? s + t.income : s, 0)
    return { cost, income, profit: income - cost }
  })

  const grandCost   = allTasks.reduce((s, t) => s + t.vendor_cost * t.months.length, 0)
  const grandIncome = allTasks.reduce((s, t) => s + t.income * t.months.length, 0)
  const grandProfit = grandIncome - grandCost

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-800">年間スケジュール表</h1>
          <p className="text-xs text-gray-400 mt-0.5">全物件の定期業務一覧</p>
        </div>
        {!loading && allTasks.length > 0 && (
          <div className="flex gap-4 text-sm flex-shrink-0">
            <div>
              <span className="text-gray-400 text-xs">年間コスト </span>
              <span className="font-semibold text-gray-700">{grandCost.toLocaleString()}円</span>
            </div>
            <div>
              <span className="text-gray-400 text-xs">年間受取 </span>
              <span className="font-semibold text-gray-700">{grandIncome.toLocaleString()}円</span>
            </div>
            <div>
              <span className="text-gray-400 text-xs">年間利益 </span>
              <span className={`font-bold ${grandProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {grandProfit.toLocaleString()}円
              </span>
            </div>
          </div>
        )}
      </div>

      {/* テーブル */}
      <div className="flex-1 overflow-auto p-3 md:p-4">
        {loading ? (
          <div className="text-center text-gray-400 py-12">読み込み中...</div>
        ) : mansionGroups.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>定期業務が登録されていません。</p>
            <p className="text-sm mt-1">各物件の「定期業務」タブから登録してください。</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 sticky left-0 bg-gray-50 z-10 min-w-[180px]">
                      物件・業務名
                    </th>
                    {MONTHS.map(m => (
                      <th key={m} className="text-center py-2.5 font-medium text-gray-500 w-9 text-xs whitespace-nowrap">
                        {m}
                      </th>
                    ))}
                    <th className="text-right px-3 py-2.5 font-medium text-gray-500 text-xs whitespace-nowrap">年コスト</th>
                    <th className="text-right px-3 py-2.5 font-medium text-gray-500 text-xs whitespace-nowrap">年受取</th>
                    <th className="text-right px-3 py-2.5 font-medium text-gray-500 text-xs whitespace-nowrap">年利益</th>
                  </tr>
                </thead>
                <tbody>
                  {mansionGroups.map(({ mansion, tasks }) => (
                    <Fragment key={mansion.id}>
                      {/* 物件ヘッダー行 */}
                      <tr className="bg-blue-50 border-t-2 border-blue-100">
                        <td
                          colSpan={16}
                          className="px-4 py-1.5 text-xs font-bold text-blue-700 sticky left-0 bg-blue-50 z-10"
                        >
                          {mansion.name}
                        </td>
                      </tr>
                      {/* 業務行 */}
                      {tasks.map((task, idx) => {
                        const tCost   = task.vendor_cost * task.months.length
                        const tIncome = task.income * task.months.length
                        const tProfit = tIncome - tCost
                        const bg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        return (
                          <tr key={task.id} className={`border-b border-gray-100 ${bg}`}>
                            <td className={`px-4 py-2 sticky left-0 z-10 ${bg}`}>
                              <div className="text-xs font-medium text-gray-700 whitespace-nowrap pl-2">
                                {task.name}
                              </div>
                              <div className="text-xs text-gray-400">{task.frequency}</div>
                            </td>
                            {Array.from({ length: 12 }, (_, i) => (
                              <td key={i} className="text-center py-2">
                                {task.months.includes(i + 1) ? (
                                  <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                                    ✓
                                  </span>
                                ) : (
                                  <span className="text-gray-200 text-xs">–</span>
                                )}
                              </td>
                            ))}
                            <td className="text-right px-3 py-2 text-xs text-gray-600 whitespace-nowrap">
                              {tCost > 0 ? tCost.toLocaleString() : <span className="text-gray-300">–</span>}
                            </td>
                            <td className="text-right px-3 py-2 text-xs text-gray-600 whitespace-nowrap">
                              {tIncome > 0 ? tIncome.toLocaleString() : <span className="text-gray-300">–</span>}
                            </td>
                            <td className={`text-right px-3 py-2 text-xs font-medium whitespace-nowrap ${tProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {tProfit.toLocaleString()}
                            </td>
                          </tr>
                        )
                      })}
                    </Fragment>
                  ))}
                </tbody>

                {/* 合計フッター */}
                <tfoot className="border-t-2 border-gray-300">
                  <tr className="bg-blue-50">
                    <td className="px-4 py-2 text-xs font-semibold text-gray-600 sticky left-0 bg-blue-50 z-10 whitespace-nowrap">
                      月間コスト合計
                    </td>
                    {monthlyTotals.map((t, i) => (
                      <td key={i} className="text-center py-2 text-xs text-gray-600 whitespace-nowrap">
                        {t.cost > 0 ? t.cost.toLocaleString() : <span className="text-gray-300">–</span>}
                      </td>
                    ))}
                    <td colSpan={3} />
                  </tr>
                  <tr className="bg-green-50">
                    <td className="px-4 py-2 text-xs font-semibold text-gray-600 sticky left-0 bg-green-50 z-10 whitespace-nowrap">
                      月間受取合計
                    </td>
                    {monthlyTotals.map((t, i) => (
                      <td key={i} className="text-center py-2 text-xs text-gray-600 whitespace-nowrap">
                        {t.income > 0 ? t.income.toLocaleString() : <span className="text-gray-300">–</span>}
                      </td>
                    ))}
                    <td colSpan={3} />
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="px-4 py-2 text-xs font-semibold text-gray-600 sticky left-0 bg-gray-100 z-10 whitespace-nowrap">
                      月間利益合計
                    </td>
                    {monthlyTotals.map((t, i) => (
                      <td key={i} className="text-center py-2 text-xs font-medium whitespace-nowrap">
                        {t.cost > 0 || t.income > 0 ? (
                          <span className={t.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {t.profit.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-300">–</span>
                        )}
                      </td>
                    ))}
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
