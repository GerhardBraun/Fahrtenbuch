import { useState } from 'react'
import { newId, synchronisiereWerte } from '../logic'
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
        <ZieleListe
          ziele={ziele}
          zieleZweck={zieleZweck}
          onZieleChange={onZieleChange}
          onZieleZweckChange={onZieleZweckChange}
        />
      ) : (
        <ZielZweckListe
          ziele={ziele}
          zieleZweck={zieleZweck}
          onZieleChange={onZieleChange}
          onZieleZweckChange={onZieleZweckChange}
        />
      )}
    </div>
  )
}

function enthaelt(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.trim().toLowerCase())
}

function ZieleListe({
  ziele,
  zieleZweck,
  onZieleChange,
  onZieleZweckChange,
}: {
  ziele: Ziel[]
  zieleZweck: ZielZweck[]
  onZieleChange: (ziele: Ziel[]) => Promise<void>
  onZieleZweckChange: (zieleZweck: ZielZweck[]) => Promise<void>
}) {
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
    const ortTrim = ort.trim()
    const strasseTrim = strasse.trim()
    const werte = {
      Rad: { km: Number(radKm) || 0, dauerMin: Number(radMin) || 0 },
      Auto: { km: Number(autoKm) || 0, dauerMin: Number(autoMin) || 0 },
    }

    let aktuelleZiele: Ziel[]
    if (selectedId) {
      aktuelleZiele = ziele.map((z) => (z.id === selectedId ? { ...z, ort: ortTrim, strasse: strasseTrim, werte } : z))
    } else {
      const neues: Ziel = { id: newId('z-'), ort: ortTrim, strasse: strasseTrim, werte }
      aktuelleZiele = [...ziele, neues]
      setSelectedId(neues.id)
    }

    const synchronisiert = synchronisiereWerte(ortTrim, strasseTrim, werte, aktuelleZiele, zieleZweck)
    await onZieleChange(synchronisiert.ziele)
    await onZieleZweckChange(synchronisiert.zieleZweck)
  }

  async function loeschen() {
    if (!selectedId) return
    await onZieleChange(ziele.filter((z) => z.id !== selectedId))
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
          Leeren
        </button>
      </div>

      <ul className="ziel-liste">
        {gefiltert.map((z) => (
          <li key={z.id} className={z.id === selectedId ? 'selected' : ''} onClick={() => laden(z)}>
            <span className="ziel-liste-text">{z.strasse ? `${z.ort}, ${z.strasse}` : z.ort}</span>
            <span className="ziel-liste-werte">
              <span>{z.werte.Rad.km}</span>
              <span>{z.werte.Rad.dauerMin}</span>
              <span>{z.werte.Auto.km}</span>
              <span>{z.werte.Auto.dauerMin}</span>
            </span>
          </li>
        ))}
        {gefiltert.length === 0 && <li className="hinweis">Keine Treffer</li>}
      </ul>
    </>
  )
}

function ZielZweckListe({
  ziele,
  zieleZweck,
  onZieleChange,
  onZieleZweckChange,
}: {
  ziele: Ziel[]
  zieleZweck: ZielZweck[]
  onZieleChange: (ziele: Ziel[]) => Promise<void>
  onZieleZweckChange: (zieleZweck: ZielZweck[]) => Promise<void>
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
    const ortTrim = ort.trim()
    const strasseTrim = strasse.trim()
    const werte = {
      Rad: { km: Number(radKm) || 0, dauerMin: Number(radMin) || 0 },
      Auto: { km: Number(autoKm) || 0, dauerMin: Number(autoMin) || 0 },
    }

    let aktuelleZielZweck: ZielZweck[]
    if (selectedId) {
      aktuelleZielZweck = zieleZweck.map((z) =>
        z.id === selectedId ? { ...z, ort: ortTrim, strasse: strasseTrim, zweck: zweck.trim(), werte } : z,
      )
    } else {
      const neues: ZielZweck = { id: newId('zz-'), ort: ortTrim, strasse: strasseTrim, zweck: zweck.trim(), werte }
      aktuelleZielZweck = [...zieleZweck, neues]
      setSelectedId(neues.id)
    }

    const synchronisiert = synchronisiereWerte(ortTrim, strasseTrim, werte, ziele, aktuelleZielZweck)
    await onZieleChange(synchronisiert.ziele)
    await onZieleZweckChange(synchronisiert.zieleZweck)
  }

  async function loeschen() {
    if (!selectedId) return
    await onZieleZweckChange(zieleZweck.filter((z) => z.id !== selectedId))
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
          Leeren
        </button>
      </div>

      <ul className="ziel-liste">
        {gefiltert.map((z) => (
          <li key={z.id} className={z.id === selectedId ? 'selected' : ''} onClick={() => laden(z)}>
            <span className="ziel-liste-text">
              {z.strasse ? `${z.ort}, ${z.strasse}: ${z.zweck}` : `${z.ort}: ${z.zweck}`}
            </span>
            <span className="ziel-liste-werte">
              <span>{z.werte.Rad.km}</span>
              <span>{z.werte.Rad.dauerMin}</span>
              <span>{z.werte.Auto.km}</span>
              <span>{z.werte.Auto.dauerMin}</span>
            </span>
          </li>
        ))}
        {gefiltert.length === 0 && <li className="hinweis">Keine Treffer</li>}
      </ul>
    </>
  )
}
