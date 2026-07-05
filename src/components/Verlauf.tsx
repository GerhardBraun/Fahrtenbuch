import { useState } from 'react'
import type { Etappe, FahrzeugId } from '../types'
import { AutoIcon, RadIcon } from './Icons'

interface Props {
  etappen: Etappe[]
  onChange: (etappen: Etappe[]) => Promise<void>
}

function formatDatumAnzeige(datum: string): string {
  const [j, m, t] = datum.split('-')
  return datum ? `${t}.${m}.${j}` : ''
}

export default function Verlauf({ etappen, onChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [datum, setDatum] = useState('')
  const [fahrzeug, setFahrzeug] = useState<FahrzeugId>('Rad')
  const [dienstlich, setDienstlich] = useState(true)
  const [start, setStart] = useState('')
  const [ziel, setZiel] = useState('')
  const [zweck, setZweck] = useState('')
  const [abfahrt, setAbfahrt] = useState('')
  const [ankunft, setAnkunft] = useState('')
  const [strecke, setStrecke] = useState('')

  function laden(e: Etappe) {
    setSelectedId(e.id)
    setDatum(e.datum)
    setFahrzeug(e.fahrzeug)
    setDienstlich(e.dienstlich)
    setStart(e.start)
    setZiel(e.ziel)
    setZweck(e.zweck)
    setAbfahrt(e.abfahrt)
    setAnkunft(e.ankunft)
    setStrecke(String(e.strecke))
  }

  function leeren() {
    setSelectedId(null)
    setDatum('')
    setFahrzeug('Rad')
    setDienstlich(true)
    setStart('')
    setZiel('')
    setZweck('')
    setAbfahrt('')
    setAnkunft('')
    setStrecke('')
  }

  async function speichern() {
    if (!selectedId) return
    await onChange(
      etappen.map((e) =>
        e.id === selectedId
          ? { ...e, datum, fahrzeug, dienstlich, start, ziel, zweck, abfahrt, ankunft, strecke: Number(strecke) || 0 }
          : e,
      ),
    )
  }

  async function loeschen() {
    if (!selectedId) return
    if (!confirm('Diese Fahrt wirklich löschen?')) return
    await onChange(etappen.filter((e) => e.id !== selectedId))
    leeren()
  }

  const sortiert = [...etappen].reverse()

  return (
    <div className="form">
      <h2>Verlauf</h2>

      <div className="kopf-zeile">
        <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
        <div className="fahrzeug-icons">
          <button
            type="button"
            className={fahrzeug === 'Rad' ? 'active' : ''}
            title="Fahrrad"
            aria-label="Fahrrad"
            onClick={() => setFahrzeug('Rad')}
          >
            <RadIcon />
          </button>
          <button
            type="button"
            className={fahrzeug === 'Auto' ? 'active' : ''}
            title="Auto"
            aria-label="Auto"
            onClick={() => setFahrzeug('Auto')}
          >
            <AutoIcon />
          </button>
        </div>
        <div className="segmented">
          <button type="button" className={dienstlich ? 'active' : ''} onClick={() => setDienstlich(true)}>
            dienstl.
          </button>
          <button type="button" className={!dienstlich ? 'active' : ''} onClick={() => setDienstlich(false)}>
            privat
          </button>
        </div>
      </div>

      <label>
        Start
        <input value={start} onChange={(e) => setStart(e.target.value)} />
      </label>
      <label>
        Ziel
        <input value={ziel} onChange={(e) => setZiel(e.target.value)} />
      </label>
      <label>
        Anlass/Zweck
        <input value={zweck} onChange={(e) => setZweck(e.target.value)} />
      </label>

      <div className="zeit-zeile">
        <label>
          Abfahrt
          <input type="time" value={abfahrt} onChange={(e) => setAbfahrt(e.target.value)} />
        </label>
        <label>
          Ankunft
          <input type="time" value={ankunft} onChange={(e) => setAnkunft(e.target.value)} />
        </label>
        <label>
          km
          <input type="number" inputMode="numeric" value={strecke} onChange={(e) => setStrecke(e.target.value)} />
        </label>
      </div>

      <div className="aktionen">
        <button type="button" className="primary" onClick={speichern} disabled={!selectedId}>
          Speichern
        </button>
        <button type="button" onClick={loeschen} disabled={!selectedId}>
          Löschen
        </button>
        <button type="button" onClick={leeren}>
          Leeren
        </button>
      </div>

      <ul className="ziel-liste">
        {sortiert.map((e) => (
          <li
            key={e.id}
            className={`verlauf-eintrag ${e.id === selectedId ? 'selected' : ''} ${e.exportiert ? 'exportiert' : ''}`}
            onClick={() => laden(e)}
          >
            <div className="verlauf-zeile1">
              <span>{formatDatumAnzeige(e.datum)}</span>
              <span>{e.fahrzeug}</span>
              <span>{e.dienstlich ? 'dienstl.' : 'privat'}</span>
              {e.exportiert && <span className="badge-inline">exportiert</span>}
            </div>
            <div className="verlauf-zeile2">
              <span>{e.start}</span>
              {e.ziel && (
                <>
                  <span>→</span>
                  <span>{e.ziel}</span>
                </>
              )}
            </div>
            <div className="verlauf-zeile3">
              <span>{e.abfahrt}</span>
              <span>{e.ankunft}</span>
              <span>{e.zweck}</span>
              <span>{e.strecke} km</span>
            </div>
          </li>
        ))}
        {sortiert.length === 0 && <li className="hinweis">Noch keine Fahrten erfasst.</li>}
      </ul>
    </div>
  )
}
