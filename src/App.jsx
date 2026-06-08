import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import MansionDetail from './components/MansionDetail'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mansions, setMansions] = useState([])
  const [selectedMansion, setSelectedMansion] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) {
        setMansions([])
        setSelectedMansion(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchMansions = useCallback(async () => {
    const { data } = await supabase
      .from('mansions')
      .select('*')
      .order('created_at', { ascending: true })

    if (data) {
      setMansions(data)
      setSelectedMansion(prev => {
        if (prev) return data.find(m => m.id === prev.id) ?? data[0] ?? null
        return data[0] ?? null
      })
    }
  }, [])

  useEffect(() => {
    if (session) fetchMansions()
  }, [session, fetchMansions])

  useEffect(() => {
    if (!session) return

    const channel = supabase
      .channel('mansions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mansions' }, () => {
        fetchMansions()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session, fetchMansions])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500 text-sm">読み込み中...</div>
      </div>
    )
  }

  if (!session) return <Auth />

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 md:flex-row">

      {/* モバイル用トップバー */}
      <div className="md:hidden flex items-center gap-3 px-4 h-14 bg-gray-900 text-white flex-shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          aria-label="メニューを開く"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">マンション管理</p>
          {selectedMansion && (
            <p className="text-xs text-gray-400 truncate">{selectedMansion.name}</p>
          )}
        </div>
      </div>

      {/* モバイル用オーバーレイ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        mansions={mansions}
        selectedMansion={selectedMansion}
        onSelect={m => { setSelectedMansion(m); setSidebarOpen(false) }}
        onMansionsChange={fetchMansions}
        session={session}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        {selectedMansion ? (
          <MansionDetail key={selectedMansion.id} mansion={selectedMansion} onMansionsChange={fetchMansions} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 p-6">
            <div className="text-center">
              <p className="text-base font-medium text-gray-500 mb-1">物件が選択されていません</p>
              <p className="text-sm">メニューから物件を選択するか、新しく追加してください。</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
