import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function MansionForm({ mansion, onClose, onSaved }) {
  const [name, setName] = useState(mansion?.name ?? '')
  const [address, setAddress] = useState(mansion?.address ?? '')
  const [builtAt, setBuiltAt] = useState(mansion?.built_at?.slice(0, 7) ?? '')
  const [totalUnits, setTotalUnits] = useState(mansion?.total_units ?? '')
  const [floors, setFloors] = useState(mansion?.floors ?? '')
  const [managerName, setManagerName] = useState(mansion?.manager_name ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      name,
      address: address || null,
      built_at: builtAt ? builtAt + '-01' : null,
      total_units: totalUnits !== '' ? parseInt(totalUnits) : null,
      floors: floors !== '' ? parseInt(floors) : null,
      manager_name: managerName || null,
    }

    if (mansion) {
      const { error } = await supabase.from('mansions').update(payload).eq('id', mansion.id)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('mansions').insert({ ...payload, user_id: user.id })
      if (error) { setError(error.message); setLoading(false); return }
    }

    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          {mansion ? '物件を編集' : '物件を追加'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              物件名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="〇〇マンション"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="東京都〇〇区..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">建築年月</label>
              <input
                type="month"
                value={builtAt}
                onChange={e => setBuiltAt(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">担当者名</label>
              <input
                type="text"
                value={managerName}
                onChange={e => setManagerName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="山田 太郎"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">総戸数</label>
              <div className="relative">
                <input
                  type="number"
                  value={totalUnits}
                  onChange={e => setTotalUnits(e.target.value)}
                  min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                  placeholder="50"
                />
                <span className="absolute right-3 top-2 text-sm text-gray-400">戸</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">階数</label>
              <div className="relative">
                <input
                  type="number"
                  value={floors}
                  onChange={e => setFloors(e.target.value)}
                  min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder="10"
                />
                <span className="absolute right-3 top-2 text-sm text-gray-400">階</span>
              </div>
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
  )
}
