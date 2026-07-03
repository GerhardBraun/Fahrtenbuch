import { useEffect, useState } from 'react'
import EinzelfahrtForm from './components/EinzelfahrtForm'
import EtappenForm from './components/EtappenForm'
import ExportView from './components/Export'
import Verlauf from './components/Verlauf'
import Zielverwaltung from './components/Zielverwaltung'
import { loadEtappen, loadKmStaende, loadRouten, saveEtappen, saveKmStaende, saveRouten } from './storage'
import type { Etappe, KmStaende, Route } from './types'

type Tab = 'fahrt' | 'etappen' | 'ziele' | 'verlauf' | 'export'

const TABS: { id: Tab; label: string }[] = [
  { id: 'fahrt', label: 'Fahrt' },
  { id: 'etappen', label: 'Etappen' },
  { id: 'ziele', label: 'Ziele' },
  { id: 'verlauf', label: 'Verlauf' },
  { id: 'export', label: 'Export' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('fahrt')
  const [etappen, setEtappen] = useState<Etappe[]>([])
  const [routen, setRouten] = useState<Route[]>([])
  const [kmStaende, setKmStaende] = useState<KmStaende>({ Rad: 0, Auto: 0 })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    ;(async () => {
      const [e, r, k] = await Promise.all([loadEtappen(), loadRouten(), loadKmStaende()])
      setEtappen(e)
      setRouten(r)
      setKmStaende(k)
      setLoaded(true)
    })()
  }, [])

  async function addEtappen(neue: Etappe[]) {
    const updated = [...etappen, ...neue]
    setEtappen(updated)
    await saveEtappen(updated)

    const letzte = neue[neue.length - 1]
    const updatedKm = { ...kmStaende, [letzte.fahrzeug]: letzte.kmStand }
    setKmStaende(updatedKm)
    await saveKmStaende(updatedKm)
  }

  async function updateEtappen(updated: Etappe[]) {
    setEtappen(updated)
    await saveEtappen(updated)
  }

  async function updateRouten(updated: Route[]) {
    setRouten(updated)
    await saveRouten(updated)
  }

  if (!loaded) {
    return <div className="loading">Lade…</div>
  }

  return (
    <div className="app">
      <main className="content">
        {tab === 'fahrt' && <EinzelfahrtForm routen={routen} kmStaende={kmStaende} onSave={addEtappen} />}
        {tab === 'etappen' && (
          <EtappenForm routen={routen} kmStaende={kmStaende} etappen={etappen} onSave={addEtappen} />
        )}
        {tab === 'ziele' && <Zielverwaltung routen={routen} onChange={updateRouten} />}
        {tab === 'verlauf' && <Verlauf etappen={etappen} onChange={updateEtappen} />}
        {tab === 'export' && <ExportView etappen={etappen} onChange={updateEtappen} />}
      </main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
