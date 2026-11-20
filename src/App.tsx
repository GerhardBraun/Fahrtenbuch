import { useEffect, useState } from 'react'
import Daten from './components/Daten'
import ExportView from './components/Export'
import FahrtForm from './components/FahrtForm'
import Tanken from './components/Tanken'
import Verlauf from './components/Verlauf'
import Zielverwaltung from './components/Zielverwaltung'
import {
  loadEtappen,
  loadHistorie,
  loadKmStaende,
  loadRohdaten,
  loadTankbelege,
  loadZiele,
  loadZieleZweck,
  saveEtappen,
  saveHistorie,
  saveKmStaende,
  saveRohdaten,
  saveTankbelege,
  saveZiele,
  saveZieleZweck,
} from './storage'
import type { Etappe, Historie, KmStaende, RohdatenEintrag, Tankbeleg, Ziel, ZielZweck } from './types'

type Tab = 'fahrt' | 'ziele' | 'verlauf' | 'tanken' | 'export' | 'daten'

const TABS: { id: Tab; label: string }[] = [
  { id: 'fahrt', label: 'Fahrt' },
  { id: 'verlauf', label: 'Verlauf' },
  { id: 'ziele', label: 'Listen' },
  { id: 'tanken', label: 'Tanken' },
  { id: 'export', label: 'Export' },
  { id: 'daten', label: 'Daten' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('fahrt')
  const [etappen, setEtappen] = useState<Etappe[]>([])
  const [rohdaten, setRohdaten] = useState<RohdatenEintrag[]>([])
  const [ziele, setZiele] = useState<Ziel[]>([])
  const [zieleZweck, setZieleZweck] = useState<ZielZweck[]>([])
  const [historie, setHistorie] = useState<Historie>({ orte: [], strassen: [], zwecke: [] })
  const [kmStaende, setKmStaende] = useState<KmStaende>({ Rad: 0, Auto: 0 })
  const [tankbelege, setTankbelege] = useState<Tankbeleg[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    ;(async () => {
      const [e, r, z, zz, h, k, t] = await Promise.all([
        loadEtappen(),
        loadRohdaten(),
        loadZiele(),
        loadZieleZweck(),
        loadHistorie(),
        loadKmStaende(),
        loadTankbelege(),
      ])
      setEtappen(e)
      setRohdaten(r)
      setZiele(z)
      setZieleZweck(zz)
      setHistorie(h)
      setKmStaende(k)
      setTankbelege(t)
      setLoaded(true)
    })()
  }, [])

  // Aktuellen Stand immer frisch aus IndexedDB lesen statt aus dem React-State zu übernehmen:
  // Wenn zwei Speichervorgänge kurz hintereinander passieren, kann der React-State beim zweiten
  // Aufruf noch veraltet sein (Closure zur Renderzeit) und würde den ersten sonst überschreiben.
  async function addEtappen(neue: Etappe[]) {
    const aktuelleEtappen = await loadEtappen()
    const updated = [...aktuelleEtappen, ...neue]
    await saveEtappen(updated)
    setEtappen(updated)

    const letzte = neue[neue.length - 1]
    const aktuelleKmStaende = await loadKmStaende()
    const updatedKm = { ...aktuelleKmStaende, [letzte.fahrzeug]: letzte.kmStand }
    await saveKmStaende(updatedKm)
    setKmStaende(updatedKm)
  }

  async function addRohdatenEintrag(neu: RohdatenEintrag) {
    const aktuelleRohdaten = await loadRohdaten()
    const updated = [...aktuelleRohdaten, neu]
    await saveRohdaten(updated)
    setRohdaten(updated)
  }

  async function updateEtappen(updated: Etappe[]) {
    await saveEtappen(updated)
    setEtappen(updated)
  }

  async function updateRohdaten(updated: RohdatenEintrag[]) {
    await saveRohdaten(updated)
    setRohdaten(updated)
  }

  async function updateZiele(updated: Ziel[]) {
    await saveZiele(updated)
    setZiele(updated)
  }

  async function updateZieleZweck(updated: ZielZweck[]) {
    await saveZieleZweck(updated)
    setZieleZweck(updated)
  }

  async function updateHistorie(updated: Historie) {
    await saveHistorie(updated)
    setHistorie(updated)
  }

  async function updateKmStaende(updated: KmStaende) {
    await saveKmStaende(updated)
    setKmStaende(updated)
  }

  async function updateTankbelege(updated: Tankbeleg[]) {
    await saveTankbelege(updated)
    setTankbelege(updated)
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
            onSaveRohdaten={addRohdatenEintrag}
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
        {tab === 'verlauf' && (
          <Verlauf etappen={etappen} onChange={updateEtappen} rohdaten={rohdaten} onChangeRohdaten={updateRohdaten} />
        )}
        {tab === 'tanken' && <Tanken belege={tankbelege} onChange={updateTankbelege} />}
        {tab === 'export' && (
          <ExportView
            etappen={etappen}
            onChange={updateEtappen}
            rohdaten={rohdaten}
            onChangeRohdaten={updateRohdaten}
            tankbelege={tankbelege}
            onChangeTankbelege={updateTankbelege}
          />
        )}
        {tab === 'daten' && (
          <Daten
            historie={historie}
            ziele={ziele}
            zieleZweck={zieleZweck}
            kmStaende={kmStaende}
            tankbelege={tankbelege}
            onHistorieChange={updateHistorie}
            onZieleChange={updateZiele}
            onZieleZweckChange={updateZieleZweck}
            onKmStaendeChange={updateKmStaende}
            onTankbelegeChange={updateTankbelege}
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
