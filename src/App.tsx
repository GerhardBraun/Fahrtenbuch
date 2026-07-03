import { useEffect, useState } from 'react'
import Daten from './components/Daten'
import ExportView from './components/Export'
import FahrtForm from './components/FahrtForm'
import Verlauf from './components/Verlauf'
import Zielverwaltung from './components/Zielverwaltung'
import {
  loadEtappen,
  loadHistorie,
  loadKmStaende,
  loadZiele,
  loadZieleZweck,
  saveEtappen,
  saveHistorie,
  saveKmStaende,
  saveZiele,
  saveZieleZweck,
} from './storage'
import type { Etappe, Historie, KmStaende, Ziel, ZielZweck } from './types'

type Tab = 'fahrt' | 'ziele' | 'verlauf' | 'export' | 'daten'

const TABS: { id: Tab; label: string }[] = [
  { id: 'fahrt', label: 'Fahrt' },
  { id: 'ziele', label: 'Ziele' },
  { id: 'verlauf', label: 'Verlauf' },
  { id: 'export', label: 'Export' },
  { id: 'daten', label: 'Daten' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('fahrt')
  const [etappen, setEtappen] = useState<Etappe[]>([])
  const [ziele, setZiele] = useState<Ziel[]>([])
  const [zieleZweck, setZieleZweck] = useState<ZielZweck[]>([])
  const [historie, setHistorie] = useState<Historie>({ orte: [], strassen: [], zwecke: [] })
  const [kmStaende, setKmStaende] = useState<KmStaende>({ Rad: 0, Auto: 0 })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    ;(async () => {
      const [e, z, zz, h, k] = await Promise.all([
        loadEtappen(),
        loadZiele(),
        loadZieleZweck(),
        loadHistorie(),
        loadKmStaende(),
      ])
      setEtappen(e)
      setZiele(z)
      setZieleZweck(zz)
      setHistorie(h)
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

  async function updateZiele(updated: Ziel[]) {
    setZiele(updated)
    await saveZiele(updated)
  }

  async function updateZieleZweck(updated: ZielZweck[]) {
    setZieleZweck(updated)
    await saveZieleZweck(updated)
  }

  async function updateHistorie(updated: Historie) {
    setHistorie(updated)
    await saveHistorie(updated)
  }

  if (!loaded) {
    return <div className="loading">Lade…</div>
  }

  return (
    <div className="app">
      <main className="content">
        {tab === 'fahrt' && (
          <FahrtForm
            ziele={ziele}
            zieleZweck={zieleZweck}
            historie={historie}
            kmStaende={kmStaende}
            etappen={etappen}
            onSave={addEtappen}
            onZieleChange={updateZiele}
            onZieleZweckChange={updateZieleZweck}
            onHistorieChange={updateHistorie}
          />
        )}
        {tab === 'ziele' && (
          <Zielverwaltung
            ziele={ziele}
            zieleZweck={zieleZweck}
            onZieleChange={updateZiele}
            onZieleZweckChange={updateZieleZweck}
          />
        )}
        {tab === 'verlauf' && <Verlauf etappen={etappen} onChange={updateEtappen} />}
        {tab === 'export' && <ExportView etappen={etappen} onChange={updateEtappen} />}
        {tab === 'daten' && (
          <Daten
            historie={historie}
            ziele={ziele}
            zieleZweck={zieleZweck}
            onHistorieChange={updateHistorie}
            onZieleChange={updateZiele}
            onZieleZweckChange={updateZieleZweck}
          />
        )}
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
