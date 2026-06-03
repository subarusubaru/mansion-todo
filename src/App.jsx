import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import TaskList from './components/TaskList'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mansions, setMansions] = useState([])
  const [selectedMansion, setSelectedMansion] = useState(null)

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

  useEffect(() => {
    if (session) fetchMansions()
  }, [session])

  async function fetchMansions() {
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
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500 text-sm">読み込み中...</div>
      </div>
    )
  }

  if (!session) return <Auth />

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        mansions={mansions}
        selectedMansion={selectedMansion}
        onSelect={setSelectedMansion}
        onMansionsChange={fetchMansions}
        session={session}
      />
      <main className="flex-1 overflow-hidden flex flex-col">
        {selectedMansion ? (
          <TaskList key={selectedMansion.id} mansion={selectedMansion} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-lg font-medium text-gray-500 mb-1">物件が選択されていません</p>
              <p className="text-sm">左サイドバーから物件を選択するか、新しく追加してください。</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
