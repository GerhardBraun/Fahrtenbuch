import { useState } from 'react'
import { newId } from '../logic'
import type { Ziel, ZielZweck } from '../types'

interface Props {
  ziele: Ziel[]
  zieleZweck: ZielZweck[]
  onZieleChange: (ziele: Ziel[]) => Promise<void>
  onZieleZweckChange: (zieleZweck: ZielZweck[]) => Promise<void>
}

type SubTab = 'ziele' | 'zielZweck'

export default function Zielverwaltung({ ziele, zieleZweck, onZieleChange, onZieleZweckChange }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('ziele')

  return (
    <div className="form">
      <h2>Ziele</h2>
      <div className="segmented">
        <button type="button" className={subTab === 'ziele' ? 'active' : ''} onClick={() => setSubTab('ziele')}>
          Ziele
        </button>
        <button
          type="button"
          className={subTab === 'zielZweck' ? 'active' : ''}
          onClick={() => setSubTab('zielZweck')}
        >
          Ziel und Zweck
        </button>
      </div>

      {subTab === 'ziele' ? (
        <ZieleListe ziele={ziele} onChange={onZieleChange} />
      ) : (
        <ZielZweckListe zieleZweck={zieleZweck} onChange={onZieleZweckChange} />
      )}
    </div>
  )
}

function enthaelt(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.trim().toLowerCase())
}

function ZieleListe({ ziele, onChange }: { ziele: Ziel[]; onChange: (ziele: Ziel[]) => Promise<void> }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [ort, setOrt] = useState('')
  const [strasse, setStrasse] = useState('')
  const [radKm, setRadKm] = useState('')
  const [radMin, setRadMin] = useState('')
  const [autoKm, setAutoKm] = useState('')
  const [autoMin, setAutoMin] = useState('')

  function laden(z: Ziel) {
    setSelectedId(z.id)
    setOrt(z.ort)
    setStrasse(z.strasse)
    setRadKm(String(z.werte.Rad.km))
    setRadMin(String(z.werte.Rad.dauerMin))
    setAutoKm(String(z.werte.Auto.km))
    setAutoMin(String(z.werte.Auto.dauerMin))
  }

  function neu() {
    setSelectedId(null)
    setOrt('')
    setStrasse('')
    setRadKm('')
    setRadMin('')
    setAutoKm('')
    setAutoMin('')
  }

  async function speichern() {
    if (!ort.trim()) return
    const werte = {
      Rad: { km: Number(radKm) || 0, dauerMin: Number(radMin) || 0 },
      Auto: { km: Number(autoKm) || 0, dauerMin: Number(autoMin) || 0 },
    }
    if (selectedId) {
      await onChange(ziele.map((z) => (z.id === selectedId ? { ...z, ort: ort.trim(), strasse: strasse.trim(), werte } : z)))
    } else {
      const neues: Ziel = { id: newId('z-'), ort: ort.trim(), strasse: strasse.trim(), werte }
      await onChange([...ziele, neues])
      setSelectedId(neues.id)
    }
  }

  async function loeschen() {
    if (!selectedId) return
    await onChange(ziele.filter((z) => z.id !== selectedId))
    neu()
  }

  const gefiltert = ziele
    .filter((z) => (!ort.trim() || enthaelt(z.ort, ort)) && (!strasse.trim() || enthaelt(z.strasse, strasse)))
    .sort((a, b) => (a.ort + a.strasse).localeCompare(b.ort + b.strasse))

  return (
    <>
      <label>
        Ort
        <input value={ort} onChange={(e) => setOrt(e.target.value)} />
      </label>
      <label>
        Straße
        <input value={strasse} onChange={(e) => setStrasse(e.target.value)} />
      </label>
      <div className="werte-zeile">
        <label>
          Rad km
          <input type="number" inputMode="numeric" value={radKm} onChange={(e) => setRadKm(e.target.value)} />
        </label>
        <label>
          Rad Min
          <input type="number" inputMode="numeric" value={radMin} onChange={(e) => setRadMin(e.target.value)} />
        </label>
        <label>
          Auto km
          <input type="number" inputMode="numeric" value={autoKm} onChange={(e) => setAutoKm(e.target.value)} />
        </label>
        <label>
          Auto Min
          <input type="number" inputMode="numeric" value={autoMin} onChange={(e) => setAutoMin(e.target.value)} />
        </label>
      </div>

      <div className="aktionen">
        <button type="button" className="primary" onClick={speichern}>
          Speichern
        </button>
        <button type="button" onClick={loeschen} disabled={!selectedId}>
          Löschen
        </button>
        <button type="button" onClick={neu}>
          Neu
        </button>
      </div>

      <ul className="ziel-liste">
        {gefiltert.map((z) => (
          <li
            key={z.id}
            className={z.id === selectedId ? 'selected' : ''}
            onClick={() => laden(z)}
          >
            {z.strasse ? `${z.ort}, ${z.strasse}` : z.ort}
          </li>
        ))}
        {gefiltert.length === 0 && <li className="hinweis">Keine Treffer</li>}
      </ul>
    </>
  )
}

function ZielZweckListe({
  zieleZweck,
  onChange,
}: {
  zieleZweck: ZielZweck[]
  onChange: (zieleZweck: ZielZweck[]) => Promise<void>
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [ort, setOrt] = useState('')
  const [strasse, setStrasse] = useState('')
  const [zweck, setZweck] = useState('')
  const [radKm, setRadKm] = useState('')
  const [radMin, setRadMin] = useState('')
  const [autoKm, setAutoKm] = useState('')
  const [autoMin, setAutoMin] = useState('')

  function laden(z: ZielZweck) {
    setSelectedId(z.id)
    setOrt(z.ort)
    setStrasse(z.strasse)
    setZweck(z.zweck)
    setRadKm(String(z.werte.Rad.km))
    setRadMin(String(z.werte.Rad.dauerMin))
    setAutoKm(String(z.werte.Auto.km))
    setAutoMin(String(z.werte.Auto.dauerMin))
  }

  function neu() {
    setSelectedId(null)
    setOrt('')
    setStrasse('')
    setZweck('')
    setRadKm('')
    setRadMin('')
    setAutoKm('')
    setAutoMin('')
  }

  async function speichern() {
    if (!ort.trim() || !zweck.trim()) return
    const werte = {
      Rad: { km: Number(radKm) || 0, dauerMin: Number(radMin) || 0 },
      Auto: { km: Number(autoKm) || 0, dauerMin: Number(autoMin) || 0 },
    }
    if (selectedId) {
      await onChange(
        zieleZweck.map((z) =>
          z.id === selectedId ? { ...z, ort: ort.trim(), strasse: strasse.trim(), zweck: zweck.trim(), werte } : z,
        ),
      )
    } else {
      const neues: ZielZweck = { id: newId('zz-'), ort: ort.trim(), strasse: strasse.trim(), zweck: zweck.trim(), werte }
      await onChange([...zieleZweck, neues])
      setSelectedId(neues.id)
    }
  }

  async function loeschen() {
    if (!selectedId) return
    await onChange(zieleZweck.filter((z) => z.id !== selectedId))
    neu()
  }

  const gefiltert = zieleZweck
    .filter(
      (z) =>
        (!ort.trim() || enthaelt(z.ort, ort)) &&
        (!strasse.trim() || enthaelt(z.strasse, strasse)) &&
        (!zweck.trim() || enthaelt(z.zweck, zweck)),
    )
    .sort((a, b) => (a.ort + a.strasse + a.zweck).localeCompare(b.ort + b.strasse + b.zweck))

  return (
    <>
      <label>
        Ort
        <input value={ort} onChange={(e) => setOrt(e.target.value)} />
      </label>
      <label>
        Straße
        <input value={strasse} onChange={(e) => setStrasse(e.target.value)} />
      </label>
      <label>
        Zweck
        <input value={zweck} onChange={(e) => setZweck(e.target.value)} />
      </label>
      <div className="werte-zeile">
        <label>
          Rad km
          <input type="number" inputMode="numeric" value={radKm} onChange={(e) => setRadKm(e.target.value)} />
        </label>
        <label>
          Rad Min
          <input type="number" inputMode="numeric" value={radMin} onChange={(e) => setRadMin(e.target.value)} />
        </label>
        <label>
          Auto km
          <input type="number" inputMode="numeric" value={autoKm} onChange={(e) => setAutoKm(e.target.value)} />
        </label>
        <label>
          Auto Min
          <input type="number" inputMode="numeric" value={autoMin} onChange={(e) => setAutoMin(e.target.value)} />
        </label>
      </div>

      <div className="aktionen">
        <button type="button" className="primary" onClick={speichern}>
          Speichern
        </button>
        <button type="button" onClick={loeschen} disabled={!selectedId}>
          Löschen
        </button>
        <button type="button" onClick={neu}>
          Neu
        </button>
      </div>

      <ul className="ziel-liste">
        {gefiltert.map((z) => (
          <li
            key={z.id}
            className={z.id === selectedId ? 'selected' : ''}
            onClick={() => laden(z)}
          >
            {z.strasse ? `${z.ort}, ${z.strasse}: ${z.zweck}` : `${z.ort}: ${z.zweck}`}
          </li>
        ))}
        {gefiltert.length === 0 && <li className="hinweis">Keine Treffer</li>}
      </ul>
    </>
  )
}
