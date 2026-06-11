import { useState } from 'react'
import { supabase } from '../lib/supabase'
import MansionForm from './MansionForm'

export default function Sidebar({
  mansions, selectedMansion, currentView,
  onSelectMansion, onViewChange, onMansionsChange,
  session, isOpen, onClose,
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingMansion, setEditingMansion] = useState(null)

  async function handleDelete(mansion) {
    if (!confirm(`「${mansion.name}」を削除しますか？\n関連するタスクも全て削除されます。`)) return
    await supabase.from('mansions').delete().eq('id', mansion.id)
    onMansionsChange()
  }

  function openEdit(e, mansion) {
    e.stopPropagation()
    setEditingMansion(mansion)
    setShowForm(true)
  }

  function openDelete(e, mansion) {
    e.stopPropagation()
    handleDelete(mansion)
  }

  const navItems = [
    {
      key: 'dashboard',
      label: 'ダッシュボード',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      key: 'schedule',
      label: '年間スケジュール',
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ]

  return (
    <div className={`
      fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 text-white flex flex-col
      transform transition-transform duration-300 ease-in-out
      md:relative md:w-64 md:translate-x-0 md:z-auto md:flex-shrink-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
        <div className="min-w-0">
          <h1 className="text-base font-bold tracking-wide">マンション管理</h1>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{session.user.email}</p>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors flex-shrink-0"
          aria-label="閉じる"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ナビゲーション */}
      <div className="px-2 py-2 border-b border-gray-700 flex-shrink-0">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => onViewChange(item.key)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 mb-0.5 ${
              currentView === item.key && !selectedMansion
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* 物件リスト */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex items-center justify-between px-2 py-1.5 mb-1">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">物件一覧</span>
          <button
            onClick={() => { setEditingMansion(null); setShowForm(true) }}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors text-lg leading-none"
            title="物件を追加"
          >
            +
          </button>
        </div>

        {mansions.length === 0 && (
          <p className="text-xs text-gray-500 px-2 py-3">
            物件がありません。
            <br />「+」から追加してください。
          </p>
        )}

        {[...mansions].sort((a, b) => {
          const numA = parseInt(a.name.match(/^\d+/)?.[0] ?? Infinity, 10)
          const numB = parseInt(b.name.match(/^\d+/)?.[0] ?? Infinity, 10)
          return numA - numB
        }).map(mansion => (
          <div
            key={mansion.id}
            className={`group flex items-center justify-between rounded-lg px-3 py-3 cursor-pointer mb-0.5 transition-colors ${
              selectedMansion?.id === mansion.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => onSelectMansion(mansion)}
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{mansion.name}</div>
              {mansion.address && (
                <div className="text-xs opacity-60 truncate mt-0.5">{mansion.address}</div>
              )}
            </div>
            <div className="flex gap-0.5 ml-2 flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100">
              <button
                onClick={e => openEdit(e, mansion)}
                className="text-xs px-2 py-1 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
                title="編集"
              >
                編
              </button>
              <button
                onClick={e => openDelete(e, mansion)}
                className="text-xs px-2 py-1 rounded hover:bg-red-500 transition-colors"
                title="削除"
              >
                削
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-700 flex-shrink-0">
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full text-sm text-gray-400 hover:text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          ログアウト
        </button>
      </div>

      {showForm && (
        <MansionForm
          mansion={editingMansion}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); onMansionsChange() }}
        />
      )}
    </div>
  )
}
