import { useState } from 'react'
import type { Etappe, FahrzeugId, RohdatenEintrag } from '../types'
import { AutoIcon, RadIcon } from './Icons'

interface Props {
  etappen: Etappe[]
  onChange: (etappen: Etappe[]) => Promise<void>
  rohdaten: RohdatenEintrag[]
  onChangeRohdaten: (rohdaten: RohdatenEintrag[]) => Promise<void>
}

type SubTab = 'etappen' | 'rohdaten'

function formatDatumAnzeige(datum: string): string {
  const [j, m, t] = datum.split('-')
  return datum ? `${t}.${m}.${j}` : ''
}

export default function Verlauf({ etappen, onChange, rohdaten, onChangeRohdaten }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('etappen')

  return (
    <div className="form">
      <h2 className="kompakt-kopf">Verlauf</h2>
      <div className="segmented aktionen">
        <button type="button" className={subTab === 'etappen' ? 'active' : ''} onClick={() => setSubTab('etappen')}>
          Etappen
        </button>
        <button
          type="button"
          className={subTab === 'rohdaten' ? 'active' : ''}
          onClick={() => setSubTab('rohdaten')}
        >
          Rohdaten
        </button>
      </div>

      {subTab === 'etappen' ? (
        <EtappenListe etappen={etappen} onChange={onChange} />
      ) : (
        <RohdatenListe rohdaten={rohdaten} onChange={onChangeRohdaten} />
      )}
    </div>
  )
}

function EtappenListe({
  etappen,
  onChange,
}: {
  etappen: Etappe[]
  onChange: (etappen: Etappe[]) => Promise<void>
}) {
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

  async function privateLoeschen() {
    if (!confirm(`Alle ${anzahlPrivat} privaten Fahrten endgültig aus dem Verlauf löschen?`)) return
    const ausgewaehlteFahrt = etappen.find((e) => e.id === selectedId)
    await onChange(etappen.filter((e) => e.dienstlich))
    if (ausgewaehlteFahrt && !ausgewaehlteFahrt.dienstlich) leeren()
  }

  const sortiert = [...etappen].reverse()
  const anzahlPrivat = etappen.filter((e) => !e.dienstlich).length

  return (
    <>
      <div className="sticky-kopf">
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

        <label className="feld-zeile">
          <span>Start</span>
          <input value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="feld-zeile">
          <span>Ziel</span>
          <input value={ziel} onChange={(e) => setZiel(e.target.value)} />
        </label>
        <label className="feld-zeile">
          <span>Anlass/<br />Zweck</span>
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

      <button type="button" onClick={privateLoeschen} disabled={anzahlPrivat === 0}>
        Private Fahrten aus dem Verlauf löschen ({anzahlPrivat})
      </button>
    </>
  )
}

function RohdatenListe({
  rohdaten,
  onChange,
}: {
  rohdaten: RohdatenEintrag[]
  onChange: (rohdaten: RohdatenEintrag[]) => Promise<void>
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [datum, setDatum] = useState('')
  const [fahrzeug, setFahrzeug] = useState<FahrzeugId>('Rad')
  const [dienstlich, setDienstlich] = useState(true)
  const [ort, setOrt] = useState('')
  const [strasse, setStrasse] = useState('')
  const [zweck, setZweck] = useState('')
  const [abfahrt, setAbfahrt] = useState('')
  const [ankunft, setAnkunft] = useState('')
  const [kmStandEnde, setKmStandEnde] = useState('')

  function laden(r: RohdatenEintrag) {
    setSelectedId(r.id)
    setDatum(r.datum)
    setFahrzeug(r.fahrzeug)
    setDienstlich(r.dienstlich)
    setOrt(r.ort)
    setStrasse(r.strasse)
    setZweck(r.zweck)
    setAbfahrt(r.abfahrt)
    setAnkunft(r.ankunft)
    setKmStandEnde(String(r.kmStandEnde))
  }

  function leeren() {
    setSelectedId(null)
    setDatum('')
    setFahrzeug('Rad')
    setDienstlich(true)
    setOrt('')
    setStrasse('')
    setZweck('')
    setAbfahrt('')
    setAnkunft('')
    setKmStandEnde('')
  }

  async function speichern() {
    if (!selectedId) return
    await onChange(
      rohdaten.map((r) =>
        r.id === selectedId
          ? {
              ...r,
              datum,
              fahrzeug,
              dienstlich,
              ort,
              strasse,
              zweck,
              abfahrt,
              ankunft,
              kmStandEnde: Number(kmStandEnde) || 0,
            }
          : r,
      ),
    )
  }

  async function loeschen() {
    if (!selectedId) return
    if (!confirm('Diesen Rohdaten-Eintrag wirklich löschen?')) return
    await onChange(rohdaten.filter((r) => r.id !== selectedId))
    leeren()
  }

  const sortiert = [...rohdaten].reverse()

  return (
    <>
      <div className="sticky-kopf">
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

        <label className="feld-zeile">
          <span>Ort</span>
          <input value={ort} onChange={(e) => setOrt(e.target.value)} />
        </label>
        <label className="feld-zeile">
          <span>Straße</span>
          <input value={strasse} onChange={(e) => setStrasse(e.target.value)} />
        </label>
        <label className="feld-zeile">
          <span>Anlass/<br />Zweck</span>
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
            km-Stand
            <input
              type="number"
              inputMode="numeric"
              value={kmStandEnde}
              onChange={(e) => setKmStandEnde(e.target.value)}
            />
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
      </div>

      <ul className="ziel-liste">
        {sortiert.map((r) => (
          <li
            key={r.id}
            className={`verlauf-eintrag ${r.id === selectedId ? 'selected' : ''} ${r.exportiert ? 'exportiert' : ''}`}
            onClick={() => laden(r)}
          >
            <div className="verlauf-zeile1">
              <span>{formatDatumAnzeige(r.datum)}</span>
              <span>{r.fahrzeug}</span>
              <span>{r.dienstlich ? 'dienstl.' : 'privat'}</span>
              {r.exportiert && <span className="badge-inline">exportiert</span>}
            </div>
            <div className="verlauf-zeile2">
              <span>{r.ort}</span>
              {r.strasse && (
                <>
                  <span>·</span>
                  <span>{r.strasse}</span>
                </>
              )}
            </div>
            <div className="verlauf-zeile3">
              <span>{r.abfahrt}</span>
              <span>{r.ankunft}</span>
              <span>{r.zweck}</span>
              <span>{r.kmStandEnde} km</span>
            </div>
          </li>
        ))}
        {sortiert.length === 0 && <li className="hinweis">Noch keine Rohdaten erfasst.</li>}
      </ul>
    </>
  )
}
