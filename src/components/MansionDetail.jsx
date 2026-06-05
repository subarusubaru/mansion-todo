import { useState } from 'react'
import TaskList from './TaskList'
import RecurringTaskList from './RecurringTaskList'

function formatBuiltAt(builtAt) {
  if (!builtAt) return null
  const [year, month] = builtAt.split('-')
  return `${year}年${parseInt(month)}月`
}

function calcAge(builtAt) {
  if (!builtAt) return null
  const [year, month] = builtAt.split('-').map(Number)
  const now = new Date()
  let age = now.getFullYear() - year
  if (now.getMonth() + 1 < month) age--
  return age
}

export default function MansionDetail({ mansion, onMansionsChange }) {
  const [activeTab, setActiveTab] = useState('tasks')

  const builtLabel = formatBuiltAt(mansion.built_at)
  const age = calcAge(mansion.built_at)

  const infoItems = [
    builtLabel && {
      label: '建築年月',
      value: age !== null ? `${builtLabel}（築${age}年）` : builtLabel,
    },
    mansion.total_units != null && { label: '総戸数', value: `${mansion.total_units}戸` },
    mansion.floors != null && { label: '階数', value: `${mansion.floors}階建て` },
    mansion.manager_name && { label: '担当者', value: mansion.manager_name },
  ].filter(Boolean)

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* 物件名・住所 */}
      <div className="bg-white border-b border-gray-200 px-6 pt-4 pb-0">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{mansion.name}</h2>
            {mansion.address && (
              <p className="text-sm text-gray-500 mt-0.5">{mansion.address}</p>
            )}
          </div>
        </div>

        {/* 詳細情報 */}
        {infoItems.length > 0 && (
          <div className="flex flex-wrap gap-x-5 gap-y-1 mb-3">
            {infoItems.map(({ label, value }) => (
              <div key={label} className="text-sm">
                <span className="text-gray-400">{label}: </span>
                <span className="text-gray-700 font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* タブ */}
        <div className="flex">
          {[
            { key: 'tasks', label: 'タスク管理' },
            { key: 'recurring', label: '定期業務' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* タブコンテンツ */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'tasks' ? (
          <TaskList mansion={mansion} />
        ) : (
          <RecurringTaskList mansion={mansion} />
        )}
      </div>
    </div>
  )
}
