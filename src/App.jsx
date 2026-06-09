import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import MansionDetail from './components/MansionDetail'
import Dashboard from './components/Dashboard'
import AnnualSchedule from './components/AnnualSchedule'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mansions, setMansions] = useState([])
  const [selectedMansion, setSelectedMansion] = useState(null)
  const [currentView, setCurrentView] = useState('dashboard')
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
        setCurrentView('dashboard')
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
      // 選択中の物件データを最新に更新（自動選択はしない）
      setSelectedMansion(prev => {
        if (!prev) return null
        return data.find(m => m.id === prev.id) ?? null
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

  function selectMansion(mansion) {
    setSelectedMansion(mansion)
    setCurrentView(null)
    setSidebarOpen(false)
  }

  function changeView(view) {
    setCurrentView(view)
    setSelectedMansion(null)
    setSidebarOpen(false)
  }

  const mobileTitle =
    selectedMansion ? selectedMansion.name :
    currentView === 'dashboard' ? 'ダッシュボード' :
    currentView === 'schedule'  ? '年間スケジュール' : 'マンション管理'

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
        <p className="text-sm font-bold truncate">{mobileTitle}</p>
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
        currentView={currentView}
        onSelectMansion={selectMansion}
        onViewChange={changeView}
        onMansionsChange={fetchMansions}
        session={session}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        {selectedMansion ? (
          <MansionDetail
            key={selectedMansion.id}
            mansion={selectedMansion}
            onMansionsChange={fetchMansions}
          />
        ) : currentView === 'dashboard' ? (
          <Dashboard mansions={mansions} onSelectMansion={selectMansion} />
        ) : currentView === 'schedule' ? (
          <AnnualSchedule mansions={mansions} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 p-6">
            <p className="text-sm">メニューから物件を選択してください。</p>
          </div>
        )}
      </main>
    </div>
  )
}
