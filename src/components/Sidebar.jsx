import { useState } from 'react'
import { supabase } from '../lib/supabase'
import MansionForm from './MansionForm'

export default function Sidebar({ mansions, selectedMansion, onSelect, onMansionsChange, session }) {
  const [showForm, setShowForm] = useState(false)
  const [editingMansion, setEditingMansion] = useState(null)

  async function handleDelete(mansion) {
    if (!confirm(`「${mansion.name}」を削除しますか？\n関連するタスクも全て削除されます。`)) return
    await supabase.from('mansions').delete().eq('id', mansion.id)
    onMansionsChange()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
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

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen flex-shrink-0">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-base font-bold tracking-wide">マンション管理</h1>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{session.user.email}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex items-center justify-between px-2 py-1.5 mb-1">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">物件一覧</span>
          <button
            onClick={() => { setEditingMansion(null); setShowForm(true) }}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors text-lg leading-none"
            title="物件を追加"
          >
            +
          </button>
        </div>

        {mansions.length === 0 && (
          <p className="text-xs text-gray-500 px-2 py-3">
            物件がありません。
            <br />
            「+」から追加してください。
          </p>
        )}

        {mansions.map(mansion => (
          <div
            key={mansion.id}
            className={`group flex items-center justify-between rounded-lg px-2 py-2 cursor-pointer mb-0.5 transition-colors ${
              selectedMansion?.id === mansion.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => onSelect(mansion)}
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{mansion.name}</div>
              {mansion.address && (
                <div className="text-xs opacity-60 truncate mt-0.5">{mansion.address}</div>
              )}
            </div>
            <div className="flex gap-0.5 ml-1 opacity-0 group-hover:opacity-100 flex-shrink-0">
              <button
                onClick={e => openEdit(e, mansion)}
                className="text-xs px-1.5 py-0.5 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
                title="編集"
              >
                編
              </button>
              <button
                onClick={e => openDelete(e, mansion)}
                className="text-xs px-1.5 py-0.5 rounded hover:bg-red-500 transition-colors"
                title="削除"
              >
                削
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full text-sm text-gray-400 hover:text-white py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
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
