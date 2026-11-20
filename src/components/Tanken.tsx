import { useMemo, useState } from 'react'
import { newId, resolveKmEingabe } from '../logic'
import { datumKurz, istVoll, parseZahl, sortiereBelege, tankStatistik, verbrauchJeBeleg, zahl } from '../tanken'
import type { TankMittel } from '../tanken'
import type { Tankbeleg } from '../types'

interface Props {
  belege: Tankbeleg[]
  onChange: (belege: Tankbeleg[]) => Promise<void>
}

function heuteIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Zahl für ein Eingabefeld (deutsches Dezimalkomma, ohne Tausenderpunkte). */
function feldWert(n: number): string {
  return String(n).replace('.', ',')
}

export default function Tanken({ belege, onChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [datum, setDatum] = useState(heuteIso())
  const [kmStand, setKmStand] = useState('')
  const [liter, setLiter] = useState('')
  const [voll, setVoll] = useState(true)
  const [preis, setPreis] = useState('')
  const [meldung, setMeldung] = useState('')

  const statistik = useMemo(() => tankStatistik(belege), [belege])
  const verbrauch = useMemo(() => verbrauchJeBeleg(belege), [belege])
  const sortiert = useMemo(() => sortiereBelege(belege), [belege])
  const liste = useMemo(() => [...sortiert].reverse(), [sortiert])

  // Bezug für die verkürzte km-Eingabe: beim Bearbeiten der Vorgänger, sonst der jüngste Beleg.
  const bezug: Tankbeleg | undefined = selectedId
    ? sortiert[sortiert.findIndex((b) => b.id === selectedId) - 1]
    : sortiert[sortiert.length - 1]
  const bezugKm = bezug?.kmStand ?? 0
  const kmVorschau = kmStand.trim() ? resolveKmEingabe(kmStand, bezugKm) : null

  function laden(b: Tankbeleg) {
    setSelectedId(b.id)
    setDatum(b.datum)
    setKmStand(String(b.kmStand))
    setLiter(feldWert(b.liter))
    setVoll(istVoll(b))
    setPreis(feldWert(b.preis))
    setMeldung('')
  }

  function neu() {
    setSelectedId(null)
    setDatum(heuteIso())
    setKmStand('')
    setLiter('')
    setVoll(true)
    setPreis('')
  }

  async function speichern() {
    setMeldung('')
    const km = resolveKmEingabe(kmStand, bezugKm)
    const l = parseZahl(liter)
    const p = parseZahl(preis)
    if (!datum || !(km > 0) || !(l > 0) || !(p >= 0)) {
      setMeldung('Bitte Datum, km-Stand, Menge und Preis vollständig eingeben.')
      return
    }
    const daten: Omit<Tankbeleg, 'id'> = { datum, kmStand: km, liter: l, preis: p, voll }

    const andere = belege.filter((b) => b.id !== selectedId)
    const neuSortiert = sortiereBelege([...andere, { id: '', ...daten }])
    const idx = neuSortiert.findIndex((b) => b.id === '')
    const vorher = neuSortiert[idx - 1]
    const nachher = neuSortiert[idx + 1]
    if ((vorher && vorher.kmStand >= km) || (nachher && nachher.kmStand <= km)) {
      setMeldung(`Der km-Stand ${zahl(km, 0)} passt nicht zur zeitlichen Reihenfolge der übrigen Belege.`)
      return
    }

    if (selectedId) {
      await onChange(belege.map((b) => (b.id === selectedId ? { id: b.id, ...daten } : b)))
      setKmStand(String(km))
      setMeldung('Beleg geändert.')
    } else {
      await onChange([...belege, { id: newId('t-'), ...daten }])
      neu()
      setMeldung('Beleg gespeichert.')
    }
  }

  async function loeschen() {
    if (!selectedId) return
    await onChange(belege.filter((b) => b.id !== selectedId))
    neu()
    setMeldung('Beleg gelöscht.')
  }

  const { letztes, sechsMonate, gesamt, offen } = statistik

  return (
    <div className="form">
      <h2 className="kompakt-kopf">Tanken</h2>
      <div className="sticky-kopf">
        <div className="werte-zeile">
          <label className="tank-datum">
            Datum
            <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
          </label>
          <label>
            km-Stand
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={kmStand}
              onChange={(e) => setKmStand(e.target.value)}
              placeholder={bezug ? String(bezug.kmStand) : ''}
            />
          </label>
        </div>
        {kmVorschau !== null && !Number.isNaN(kmVorschau) && String(kmVorschau) !== kmStand.trim() && (
          <span className="km-vorschau">→ {zahl(kmVorschau, 0)}</span>
        )}
        <div className="werte-zeile tank-mengen">
          <label>
            Menge (l)
            <input inputMode="decimal" value={liter} onChange={(e) => setLiter(e.target.value)} />
          </label>
          <label className="checkbox tank-voll">
            <input type="checkbox" checked={voll} onChange={(e) => setVoll(e.target.checked)} />
            volltanken
          </label>
          <label>
            Preis (€)
            <input inputMode="decimal" value={preis} onChange={(e) => setPreis(e.target.value)} />
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
        {meldung && <p className="meldung">{meldung}</p>}
      </div>

      <table className="tank-tabelle">
        <thead>
          <tr>
            <th></th>
            <th>km/Tag</th>
            <th>l/100 km</th>
            <th>€/100 km</th>
          </tr>
        </thead>
        <tbody>
          <MittelZeile titel="Seit letztem Tanken" mittel={letztes} />
          <MittelZeile titel="6 Monate" mittel={sechsMonate} />
        </tbody>
        <tfoot>
          <tr>
            <th>
              Gesamt
              {gesamt && (
                <small>
                  {zahl(gesamt.liter, 1)} l · {zahl(gesamt.preis, 2)} €
                </small>
              )}
            </th>
            <td></td>
            <td>{gesamt ? zahl(gesamt.literPro100, 2) : '–'}</td>
            <td>{gesamt ? zahl(gesamt.preisPro100, 2) : '–'}</td>
          </tr>
        </tfoot>
      </table>
      {offen > 0 && (
        <p className="hinweis">
          {offen === 1 ? 'Der jüngste Beleg ist' : `Die jüngsten ${offen} Belege sind`} ohne Volltanken: nur in den
          Summen enthalten, in den Mittelwerten erst ab dem nächsten vollen Beleg.
        </p>
      )}

      <ul className="ziel-liste">
        {liste.map((b) => (
          <li key={b.id} className={b.id === selectedId ? 'selected' : ''} onClick={() => laden(b)}>
            <span className="ziel-liste-text">
              {datumKurz(b.datum)} · {zahl(b.kmStand, 0)} km
              {!istVoll(b) && <span className="badge-inline">nicht voll</span>}
            </span>
            <span className="ziel-liste-werte tank-werte">
              <span>{zahl(b.liter, 2)} l</span>
              <span>{zahl(b.preis, 2)} €</span>
              <span>{zahl(verbrauch.get(b.id), 1)}</span>
            </span>
          </li>
        ))}
        {liste.length === 0 && <li className="hinweis">Noch keine Belege</li>}
      </ul>
    </div>
  )
}

function MittelZeile({ titel, mittel }: { titel: string; mittel: TankMittel | null }) {
  return (
    <tr>
      <th>
        {titel}
        {mittel && (
          <small>
            {datumKurz(mittel.von.datum)}–{datumKurz(mittel.bis.datum)}
          </small>
        )}
      </th>
      <td>{mittel ? zahl(mittel.kmProTag, 1) : '–'}</td>
      <td>{mittel ? zahl(mittel.literPro100, 2) : '–'}</td>
      <td>{mittel ? zahl(mittel.preisPro100, 2) : '–'}</td>
    </tr>
  )
}
